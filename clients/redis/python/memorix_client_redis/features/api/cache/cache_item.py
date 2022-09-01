from memorix_client_redis.features.api.hash_key import hash_key
from memorix_client_redis.features.api.json import from_json, to_json
from .cache_api import CacheApi
from typing import Generic, Optional, Type, TypeVar, cast

KT = TypeVar("KT")
PT = TypeVar("PT")


class CacheItem(Generic[KT, PT]):
    def __init__(
        self,
        cache_api: CacheApi,
        id: str,
        payload_class: Type[PT],
    ) -> None:
        self._cache_api = cache_api
        self._id = id
        self._payload_class = payload_class

    def get(self, key: KT) -> Optional[PT]:
        res = self._cache_api._api._redis.get(hash_key(self._id, key=key))
        if res is None:
            return None

        payload = from_json(value=res, data_class=self._payload_class)
        return payload

    async def async_get(self, key: KT) -> PT:
        print("get async")
        return cast(PT, None)

    def set(self, key: KT, payload: PT) -> bool | None:
        payload_json = to_json(payload)
        return self._cache_api._api._redis.set(
            hash_key(self._id, key=key),
            payload_json,
        )

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
