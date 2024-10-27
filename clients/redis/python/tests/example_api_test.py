import typing
import asyncio
import pytest
from .example_schema_generated import (
    InlineCacheKeyUser2,
    Spaceship,
    Memorix,
    User,
)
import multiprocessing
from time import sleep
from .timeout import with_timeout


def listen_to_message() -> None:
    memorix = Memorix()
    for payload in memorix.pubsub.message.subscribe():
        print("message:", payload)


def listen_to_algo() -> None:
    memorix = Memorix()
    for payload in memorix.task.runAlgo.dequeue():
        print("task:", payload)


def test_cache() -> None:
    memorix = Memorix()

    memorix.cache.user.set("uv", User(name="uv", age=29))

    user = memorix.cache.user.get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


@pytest.mark.asyncio
async def test_cache_async() -> None:
    memorix = Memorix()

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
    memorix = Memorix()

    await memorix.cache.bestStr.async_set(
        "uv",
    )

    best_str = await memorix.cache.bestStr.async_get()
    if best_str is None:
        raise Exception("Didn't get bestStr from redis")
    assert best_str == "uv"


def test_cache_list() -> None:
    memorix = Memorix()

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
    memorix = Memorix()

    memorix.cache.user2.set(
        key=InlineCacheKeyUser2(id="uv"),
        payload=User(name="uv", age=29),
    )

    user = memorix.cache.user2.get(key=InlineCacheKeyUser2(id="uv"))
    if user is None:
        raise Exception("Didn't get user from redis")
    assert user.age == 29


def test_cache_expire_schema() -> None:
    memorix = Memorix()

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


def test_cache_expire_none() -> None:
    memorix = Memorix()

    memorix.cache.userExpire2.set(
        "uv",
        User(name="uv", age=29),
    )

    sleep(2.5)
    user = memorix.cache.userExpire2.get("uv")
    assert user is not None


def test_cache_expire_extending_on_get() -> None:
    memorix = Memorix()

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
    memorix = Memorix()

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
    memorix = Memorix()

    res = await memorix.pubsub.message.async_publish(payload="Heyy")
    assert res.subscribers_size == 0

    async def publish_in_a_second() -> None:  # noqa: WPS430 # Using here only
        await asyncio.sleep(1)
        await memorix.pubsub.message.async_publish(payload="buddy")

    asyncio.create_task(publish_in_a_second())

    payload: typing.Optional[str] = None
    async for msg in memorix.pubsub.message.async_subscribe():
        payload = msg
        break

    assert payload == "buddy"


def test_task_dequeue() -> None:
    memorix = Memorix()
    memorix.task.runAlgo.empty()
    memorix.task.runAlgo.enqueue(payload="send me dog")
    sleep(0.1)
    for payload in memorix.task.runAlgo.dequeue():
        assert payload == "send me dog"
        break


def test_task() -> None:
    memorix = Memorix()
    memorix.task.runAlgo.empty()

    task1 = multiprocessing.Process(target=listen_to_algo)
    task2 = multiprocessing.Process(target=listen_to_algo)
    task1.start()
    task2.start()

    sleep(0.1)
    queue = memorix.task.runAlgo.enqueue(payload="send me cat")

    assert queue.queue_size == 1

    sleep(0.1)

    task1.kill()
    task2.kill()


def test_task_clear() -> None:
    memorix = Memorix()
    memorix.task.runAlgo.empty()

    try:
        queue = memorix.task.runAlgo.enqueue(payload="send me cat")
        queue = memorix.task.runAlgo.enqueue(payload="send me cat")
        queue = memorix.task.runAlgo.enqueue(payload="send me cat")
        assert queue.queue_size == 3
        memorix.task.runAlgo.empty()
        queue = memorix.task.runAlgo.enqueue(payload="send me cat")
        assert queue.queue_size == 1
    finally:
        memorix.task.runAlgo.empty()


def test_task_options_schema() -> None:
    memorix = Memorix()
    memorix.task.runAlgoNewest.empty()

    try:
        memorix.task.runAlgoNewest.enqueue(payload="send me cat")
        memorix.task.runAlgoNewest.enqueue(payload="send me dog")
        for payload in memorix.task.runAlgoNewest.dequeue():
            assert payload == "send me dog"
            break
    finally:
        memorix.task.runAlgo.empty()


def test_cache_namespace() -> None:
    memorix = Memorix()

    memorix.spaceship.cache.pilot.set(Spaceship.InlineCachePayloadPilot(name="uv"))

    pilot = memorix.spaceship.cache.pilot.get()
    if pilot is None:
        raise Exception("Didn't get pilot from redis")
    assert pilot.name == "uv"

    sleep(1.5)
    pilot2 = memorix.spaceship.cache.pilot.get()
    if pilot2 is not None:
        raise Exception("pilot should have been expired")


def test_cache_recursive_namespace() -> None:
    memorix = Memorix()

    memorix.spaceship.crew.cache.count.set(10)

    count = memorix.spaceship.crew.cache.count.get()
    assert count == 10
