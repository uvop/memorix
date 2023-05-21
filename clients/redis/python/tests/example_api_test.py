import typing
import asyncio
import pytest
import os
from .example_schema_generated import (
    Animal,
    CacheUser2Key,
    CachePilotPayload,
    MemorixApi,
    User,
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


def test_connect_should_fail() -> None:
    memorix_api = MemorixApi(redis_url="redis://hello-world:6379/0")
    try:
        memorix_api.connect()
    except AttributeError as err:
        raise err
    except Exception:
        pass


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

    await memorix_api.cache.user.async_set(
        "uv",
        User(name="uv", age=29),
    )

    user = await memorix_api.cache.user.async_get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


@pytest.mark.asyncio
async def test_cache_async_no_key() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    await memorix_api.cache.bestStr.async_set(
        "uv",
        MemorixApi.DefaultOptions.Cache(
            expire=MemorixApi.DefaultOptions.Cache.Expire(
                value=500,
                is_in_ms=True,
            ),
        ),
    )

    best_str = await memorix_api.cache.bestStr.async_get()
    if best_str is None:
        raise Exception("Didn't get bestStr from redis")
    assert best_str == "uv"


def test_cache_list() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.cache.allUsers.set(
        payload=[[User(name="uv", age=29), None], [None]],
    )

    users = memorix_api.cache.allUsers.get()
    if users is None:
        raise Exception("Didn't get user from redis")
    user = users[0][0]
    if user is None:
        raise Exception("User should be defined")
    assert user.age == 29
    assert users[1][0] is None
    assert users[0][1] is None


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
        MemorixApi.DefaultOptions.Cache(
            expire=MemorixApi.DefaultOptions.Cache.Expire(
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


def test_cache_expire_schema() -> None:
    memorix_api = MemorixApi(
        redis_url=redis_url,
    )

    memorix_api.cache.userExpire.set(
        "uv",
        User(name="uv", age=29),
    )

    user1 = memorix_api.cache.userExpire.get("uv")
    if user1 is None:
        raise Exception("Didn't get user from redis")
    assert user1.age == 29
    sleep(1.5)
    user2 = memorix_api.cache.userExpire.get("uv")
    assert user2 is None


def test_cache_expire_defaults_config() -> None:
    memorix_api = MemorixApi(
        redis_url=redis_url,
    )

    memorix_api.cache.user.set(
        "uv",
        User(name="uv", age=29),
    )

    user1 = memorix_api.cache.user.get("uv")
    if user1 is None:
        raise Exception("Didn't get user from redis")
    assert user1.age == 29
    sleep(2.5)
    user2 = memorix_api.cache.user.get("uv")
    assert user2 is None


def test_cache_expire_none() -> None:
    memorix_api = MemorixApi(
        redis_url=redis_url,
    )

    memorix_api.cache.userExpire2.set(
        "uv",
        User(name="uv", age=29),
    )

    sleep(2.5)
    user = memorix_api.cache.userExpire2.get("uv")
    assert user is not None


def test_cache_expire_extending_on_get() -> None:
    memorix_api = MemorixApi(
        redis_url=redis_url,
    )

    memorix_api.cache.userExpire3.set(
        User(name="uv", age=29),
    )
    memorix_api.cache.userExpire3.extend()  # Or extend manually

    sleep(1.5)
    memorix_api.cache.userExpire3.get()
    sleep(1.5)
    user = memorix_api.cache.userExpire3.get()
    assert user is not None


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
    memorix_api.task.runAlgo.clear()
    memorix_api.task.runAlgo.queue(payload="send me dog")
    sleep(0.1)
    for res in memorix_api.task.runAlgo.dequeue():
        assert res.payload == "send me dog"
        break


def test_task() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    memorix_api.task.runAlgo.clear()

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


def test_task_clear() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    memorix_api.task.runAlgo.clear()

    try:
        queue = memorix_api.task.runAlgo.queue(payload="send me cat")
        queue = memorix_api.task.runAlgo.queue(payload="send me cat")
        queue = memorix_api.task.runAlgo.queue(payload="send me cat")
        assert queue.queue_size == 3
        memorix_api.task.runAlgo.clear()
        queue = memorix_api.task.runAlgo.queue(payload="send me cat")
        assert queue.queue_size == 1
    finally:
        memorix_api.task.runAlgo.clear()


def test_task_options_schema() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    memorix_api.task.runAlgoNewest.clear()

    try:
        memorix_api.task.runAlgoNewest.queue(payload="send me cat")
        memorix_api.task.runAlgoNewest.queue(payload="send me dog")
        for res in memorix_api.task.runAlgoNewest.dequeue():
            assert res.payload == "send me dog"
            break
    finally:
        memorix_api.task.runAlgo.clear()


def test_cache_namespace() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.spaceship.cache.pilot.set(CachePilotPayload(name="uv"))

    pilot = memorix_api.spaceship.cache.pilot.get()
    if pilot is None:
        raise Exception("Didn't get pilot from redis")
    assert pilot.name == "uv"

    sleep(1.5)
    pilot2 = memorix_api.spaceship.cache.pilot.get()
    if pilot2 is not None:
        raise Exception("pilot should have been expired")
