import os
from .example_schema_generated import MemorixApi

redis_url = os.environ["REDIS_URL"]


def start() -> None:
    memorix_api = MemorixApi(redis_url=redis_url)

    memorix_api.cache.favoriteAnimal.get(key="uv")
