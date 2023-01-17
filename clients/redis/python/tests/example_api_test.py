import typing
import asyncio
import pytest
import os
from .example_schema_generated import (
    Animal,
    CacheUser2Key,
    MemorixApi,
    MemorixClientApiDefaults,
    User,
    MemorixClientCacheSetOptions,
    MemorixClientCacheSetOptionsExpire,
)
import multiprocessing
from time import sleep
from .timeout import with_timeout

redis_url = os.environ["REDIS_URL"]


def listen_to_message() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    for res in memorix_api.pubsub.message.subscribe():
        print("message:", res.payload)


def listen_to_algo() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    for res in memorix_api.task.runAlgo.dequeue():
        print("task:", res.payload)
        res.send_returns(
            returns=Animal.cat if res.payload == "send me cat" else Animal.dog,
        )


def test_cache() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.cache.user.set("uv", User(name="uv", age=29))

    user = memorix_api.cache.user.get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


@pytest.mark.asyncio
async def test_cache_async() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    await memorix_api.cache.user.async_set("uv", User(name="uv", age=29))

    user = await memorix_api.cache.user.async_get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


@pytest.mark.asyncio
async def test_cache_async_no_key() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    await memorix_api.cache.bestStr.async_set("uv")

    best_str = await memorix_api.cache.bestStr.async_get()
    if best_str is None:
        raise Exception("Didn't get bestStr from redis")
    assert best_str == "uv"


def test_cache_complex_key() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.cache.user2.set(
        key=CacheUser2Key(id="uv"),
        payload=User(name="uv", age=29),
    )

    user = memorix_api.cache.user2.get(key=CacheUser2Key(id="uv"))
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


def test_cache_expire() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.cache.user.set(
        "uv",
        User(name="uv", age=29),
        MemorixClientCacheSetOptions(
            expire=MemorixClientCacheSetOptionsExpire(
                value=500,
                is_in_ms=True,
            ),
        ),
    )

    user1 = memorix_api.cache.user.get("uv")
    if user1 is None:
        raise Exception("Didn't get user from redis")
    assert user1.age == 29
    sleep(0.7)
    user2 = memorix_api.cache.user.get("uv")
    assert user2 is None


def test_cache_expire_defaults() -> None:
    memorix_api = MemorixApi(
        redis_url=redis_url,
        defaults=MemorixClientApiDefaults(
            cache_set_options=MemorixClientCacheSetOptions(
                expire=MemorixClientCacheSetOptionsExpire(
                    value=500,
                    is_in_ms=True,
                ),
            ),
        ),
    )

    memorix_api.cache.user.set(
        "uv",
        User(name="uv", age=29),
    )

    user1 = memorix_api.cache.user.get("uv")
    if user1 is None:
        raise Exception("Didn't get user from redis")
    assert user1.age == 29
    sleep(0.7)
    user2 = memorix_api.cache.user.get("uv")
    assert user2 is None


def test_pubsub() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    process1 = multiprocessing.Process(target=listen_to_message)
    process2 = multiprocessing.Process(target=listen_to_message)
    process1.start()
    process2.start()

    sleep(0.5)
    res = memorix_api.pubsub.message.publish(payload="Heyy buddy")
    assert res.subscribers_size == 2

    sleep(0.1)
    process1.kill()
    process2.kill()


@pytest.mark.asyncio
@with_timeout(3)
async def test_pubsub_async() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    res = await memorix_api.pubsub.message.async_publish(payload="Heyy")
    assert res.subscribers_size == 0

    async def publish_in_a_second() -> None:  # noqa: WPS430 # Using here only
        await asyncio.sleep(1)
        await memorix_api.pubsub.message.async_publish(payload="buddy")

    asyncio.create_task(publish_in_a_second())

    payload: typing.Optional[str] = None
    async for message in memorix_api.pubsub.message.async_subscribe():
        payload = message.payload
        break

    assert payload == "buddy"


def test_task_dequeue() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    memorix_api.task.runAlgo.queue(payload="send me dog")
    sleep(0.1)
    for res in memorix_api.task.runAlgo.dequeue():
        assert res.payload == "send me dog"
        break


def test_task() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    task1 = multiprocessing.Process(target=listen_to_algo)
    task2 = multiprocessing.Process(target=listen_to_algo)
    task1.start()
    task2.start()

    sleep(0.1)
    queue = memorix_api.task.runAlgo.queue(payload="send me cat")

    assert queue.queue_size == 1

    res = queue.get_returns()

    assert res.value == Animal.cat.value

    sleep(0.1)

    task1.kill()
    task2.kill()
