from .cache_api import CacheApi
from typing import Generic, TypeVar, cast

KT = TypeVar("KT")
PT = TypeVar("PT")


class CacheItem(Generic[KT, PT]):
    def __init__(
        self,
        cache_api: CacheApi,
        id: str,
    ) -> None:
        self._cache_api = cache_api
        self._id = id

    def get(self, key: KT) -> PT:
        print("get sync")
        return cast(PT, None)

    async def async_get(self, key: KT) -> PT:
        print("get async")
        return cast(PT, None)

    def set(self, key: KT, payload: PT) -> None:
        print("set sync")

    async def async_set(self, key: KT, payload: PT) -> None:
        print("set async")


class CacheItemNoKey(Generic[PT]):
    def __init__(
        self,
        cache_api: CacheApi,
        id: str,
    ) -> None:
        self._cache_api = cache_api
        self._id = id

    def get(self) -> PT:
        print("get sync")
        return cast(PT, None)

    async def async_get(self) -> PT:
        print("get async")
        return cast(PT, None)

    def set(self, payload: PT) -> None:
        print("set sync")

    async def async_set(self, payload: PT) -> None:
        print("set async")
