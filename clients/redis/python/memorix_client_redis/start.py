import os
from .example_schema_generated import Animal, MemorixApi, User

redis_url = os.environ["REDIS_URL"]


def start() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.cache.user.set(key="uv", payload=User(name="bla", age=18))

    user = memorix_api.cache.user.get(key="uv")

    print(user.age)
