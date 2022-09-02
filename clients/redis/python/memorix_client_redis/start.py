import os
from .example_schema_generated import Animal, MemorixApi, User
import multiprocessing
from time import sleep

redis_url = os.environ["REDIS_URL"]


def listen_to_message() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    for res in memorix_api.pubsub.message.subscribe():
        print("message:", res.payload)


def listen_to_algo() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)
    for res in memorix_api.task.runAlgo.dequeue():
        print("task:", res.payload)
        res.send_returns(returns=Animal.dog)


def start() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.cache.user.set("uv", User(name="uv", age=29))

    user = memorix_api.cache.user.get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    print(user.age)

    process = multiprocessing.Process(target=listen_to_message)
    process.start()

    for _num in (1, 2, 3, 4):
        sleep(0.1)
        res = memorix_api.pubsub.message.publish(payload="Heyy buddy")
        print("listeners:", res.subscribers_size)

    sleep(0.2)
    process.kill()

    task = multiprocessing.Process(target=listen_to_algo)
    task.start()

    for _num2 in (1, 2, 3, 4):
        sleep(0.1)
        queue = memorix_api.task.runAlgo.queue(payload="Im a task!")
        print("queue_size:", queue.queue_size)
        res2 = queue.get_returns()
        print("animal:", res2.value)

    sleep(0.2)
    task.kill()
