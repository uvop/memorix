import os
from .example_schema_generated import Animal, Memorix, User
import multiprocessing
from time import sleep



def listen_to_message() -> None:
    memorix = Memorix()
    for res in memorix.pubsub.message.subscribe():
        print("message:", res.payload)


def listen_to_algo() -> None:
    memorix = Memorix()
    for res in memorix.task.runAlgo.dequeue():
        print("task:", res.payload)


def start() -> None:
    memorix = Memorix()

    memorix.cache.user.set("uv", User(name="uv", age=29))

    user = memorix.cache.user.get("uv")
    if user is None:
        raise Exception("Didn't get user from redis")
    print(user.age)

    process = multiprocessing.Process(target=listen_to_message)
    process.start()

    for _num in (1, 2, 3, 4):
        sleep(0.1)
        res = memorix.pubsub.message.publish(payload="Heyy buddy")
        print("listeners:", res.subscribers_size)

    sleep(0.2)
    process.kill()

    task = multiprocessing.Process(target=listen_to_algo)
    task.start()

    for _num2 in (1, 2, 3, 4):
        sleep(0.1)
        queue = memorix.task.runAlgo.queue(payload="Im a task!")
        print("queue_size:", queue.queue_size)

    sleep(0.2)
    task.kill()
