import typing
import asyncio
import pytest
import os
from .example_schema_generated import (
    Animal,
    CacheUser2Key,
    CachePilotPayload,
    Memorix,
    User,
)
import multiprocessing
from time import sleep
from .timeout import with_timeout

redis_url = os.environ["REDIS_URL"]


def listen_to_message() -> None:
    memorix = Memorix(redis_url=redis_url)
    for res in memorix.pubsub.message.subscribe():
        print("message:", res.payload)


def listen_to_algo() -> None:
    memorix = Memorix(redis_url=redis_url)
    for res in memorix.task.runAlgo.dequeue():
        print("task:", res.payload)
        res.send_returns(
            returns=Animal.cat if res.payload == "send me cat" else Animal.dog,
        )


def test_connect_should_fail() -> None:
    memorix = Memorix(redis_url="redis://hello-world:6379/0")
    try:
        memorix.connect()
    except AttributeError as err:  # noqa: WPS329
        raise err
    except Exception:  # noqa: S110
        pass


def test_cache() -> None:
    memorix = Memorix(redis_url=redis_url)

    memorix.cache.user.set("uv", User(name="uv", age=29))

    user = memorix.cache.user.get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


@pytest.mark.asyncio
async def test_cache_async() -> None:
    memorix = Memorix(redis_url=redis_url)

    await memorix.cache.user.async_set(
        "uv",
        User(name="uv", age=29),
    )

    user = await memorix.cache.user.async_get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


@pytest.mark.asyncio
async def test_cache_async_no_key() -> None:
    memorix = Memorix(redis_url=redis_url)

    await memorix.cache.bestStr.async_set(
        "uv",
        Memorix.DefaultOptions.Cache(
            expire=Memorix.DefaultOptions.Cache.Expire(
                value=500,
                is_in_ms=True,
            ),
        ),
    )

    best_str = await memorix.cache.bestStr.async_get()
    if best_str is None:
        raise Exception("Didn't get bestStr from redis")
    assert best_str == "uv"


def test_cache_list() -> None:
    memorix = Memorix(redis_url=redis_url)

    memorix.cache.allUsers.set(
        payload=[[User(name="uv", age=29), None], [None]],
    )

    users = memorix.cache.allUsers.get()
    if users is None:
        raise Exception("Didn't get user from redis")
    user = users[0][0]
    if user is None:
        raise Exception("User should be defined")
    assert user.age == 29
    assert users[1][0] is None
    assert users[0][1] is None


def test_cache_complex_key() -> None:
    memorix = Memorix(redis_url=redis_url)

    memorix.cache.user2.set(
        key=CacheUser2Key(id="uv"),
        payload=User(name="uv", age=29),
    )

    user = memorix.cache.user2.get(key=CacheUser2Key(id="uv"))
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


def test_cache_expire() -> None:
    memorix = Memorix(redis_url=redis_url)

    memorix.cache.user.set(
        "uv",
        User(name="uv", age=29),
        Memorix.DefaultOptions.Cache(
            expire=Memorix.DefaultOptions.Cache.Expire(
                value=500,
                is_in_ms=True,
            ),
        ),
    )

    user1 = memorix.cache.user.get("uv")
    if user1 is None:
        raise Exception("Didn't get user from redis")
    assert user1.age == 29
    sleep(0.7)
    user2 = memorix.cache.user.get("uv")
    assert user2 is None


def test_cache_expire_schema() -> None:
    memorix = Memorix(
        redis_url=redis_url,
    )

    memorix.cache.userExpire.set(
        "uv",
        User(name="uv", age=29),
    )

    user1 = memorix.cache.userExpire.get("uv")
    if user1 is None:
        raise Exception("Didn't get user from redis")
    assert user1.age == 29
    sleep(1.5)
    user2 = memorix.cache.userExpire.get("uv")
    assert user2 is None


def test_cache_expire_defaults_config() -> None:
    memorix = Memorix(
        redis_url=redis_url,
    )

    memorix.cache.user.set(
        "uv",
        User(name="uv", age=29),
    )

    user1 = memorix.cache.user.get("uv")
    if user1 is None:
        raise Exception("Didn't get user from redis")
    assert user1.age == 29
    sleep(2.5)
    user2 = memorix.cache.user.get("uv")
    assert user2 is None


def test_cache_expire_none() -> None:
    memorix = Memorix(
        redis_url=redis_url,
    )

    memorix.cache.userExpire2.set(
        "uv",
        User(name="uv", age=29),
    )

    sleep(2.5)
    user = memorix.cache.userExpire2.get("uv")
    assert user is not None


def test_cache_expire_extending_on_get() -> None:
    memorix = Memorix(
        redis_url=redis_url,
    )

    memorix.cache.userExpire3.set(
        User(name="uv", age=29),
    )
    memorix.cache.userExpire3.extend()  # Or extend manually

    sleep(1.5)
    memorix.cache.userExpire3.get()
    sleep(1.5)
    user = memorix.cache.userExpire3.get()
    assert user is not None


def test_pubsub() -> None:
    memorix = Memorix(redis_url=redis_url)

    process1 = multiprocessing.Process(target=listen_to_message)
    process2 = multiprocessing.Process(target=listen_to_message)
    process1.start()
    process2.start()

    sleep(0.5)
    res = memorix.pubsub.message.publish(payload="Heyy buddy")
    assert res.subscribers_size == 2

    sleep(0.1)
    process1.kill()
    process2.kill()


@pytest.mark.asyncio
@with_timeout(3)
async def test_pubsub_async() -> None:
    memorix = Memorix(redis_url=redis_url)

    res = await memorix.pubsub.message.async_publish(payload="Heyy")
    assert res.subscribers_size == 0

    async def publish_in_a_second() -> None:  # noqa: WPS430 # Using here only
        await asyncio.sleep(1)
        await memorix.pubsub.message.async_publish(payload="buddy")

    asyncio.create_task(publish_in_a_second())

    payload: typing.Optional[str] = None
    async for message in memorix.pubsub.message.async_subscribe():
        payload = message.payload
        break

    assert payload == "buddy"


def test_task_dequeue() -> None:
    memorix = Memorix(redis_url=redis_url)
    memorix.task.runAlgo.clear()
    memorix.task.runAlgo.queue(payload="send me dog")
    sleep(0.1)
    for res in memorix.task.runAlgo.dequeue():
        assert res.payload == "send me dog"
        break


def test_task() -> None:
    memorix = Memorix(redis_url=redis_url)
    memorix.task.runAlgo.clear()

    task1 = multiprocessing.Process(target=listen_to_algo)
    task2 = multiprocessing.Process(target=listen_to_algo)
    task1.start()
    task2.start()

    sleep(0.1)
    queue = memorix.task.runAlgo.queue(payload="send me cat")

    assert queue.queue_size == 1

    res = queue.get_returns()

    assert res.value == Animal.cat.value

    sleep(0.1)

    task1.kill()
    task2.kill()


def test_task_clear() -> None:
    memorix = Memorix(redis_url=redis_url)
    memorix.task.runAlgo.clear()

    try:
        queue = memorix.task.runAlgo.queue(payload="send me cat")
        queue = memorix.task.runAlgo.queue(payload="send me cat")
        queue = memorix.task.runAlgo.queue(payload="send me cat")
        assert queue.queue_size == 3
        memorix.task.runAlgo.clear()
        queue = memorix.task.runAlgo.queue(payload="send me cat")
        assert queue.queue_size == 1
    finally:
        memorix.task.runAlgo.clear()


def test_task_options_schema() -> None:
    memorix = Memorix(redis_url=redis_url)
    memorix.task.runAlgoNewest.clear()

    try:
        memorix.task.runAlgoNewest.queue(payload="send me cat")
        memorix.task.runAlgoNewest.queue(payload="send me dog")
        for res in memorix.task.runAlgoNewest.dequeue():
            assert res.payload == "send me dog"
            break
    finally:
        memorix.task.runAlgo.clear()


def test_cache_namespace() -> None:
    memorix = Memorix(redis_url=redis_url)

    memorix.spaceship.cache.pilot.set(CachePilotPayload(name="uv"))

    pilot = memorix.spaceship.cache.pilot.get()
    if pilot is None:
        raise Exception("Didn't get pilot from redis")
    assert pilot.name == "uv"

    sleep(1.5)
    pilot2 = memorix.spaceship.cache.pilot.get()
    if pilot2 is not None:
        raise Exception("pilot should have been expired")


def test_cache_recursive_namespace() -> None:
    memorix = Memorix(redis_url=redis_url)

    memorix.spaceship.crew.cache.count.set(10)

    count = memorix.spaceship.crew.cache.count.get()
    assert count == 10
