from memorix_client_redis.features.api.hash_key import hash_key
from memorix_client_redis.features.api.json import from_json, to_json
from typing import Generic, Optional, Type, TypeVar, cast
from ..api import Api, ApiDefaults
from .cache_options import CacheSetOptions, CacheSetOptionsExpire

KT = TypeVar("KT")
PT = TypeVar("PT")


class CacheItem(Generic[KT, PT]):
    def __init__(
        self,
        api: Api,
        id: str,
        payload_class: Type[PT],
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class

    def get(self, key: KT) -> Optional[PT]:
        res = self._api._redis.get(hash_key(self._id, key=key))
        if res is None:
            return None

        payload = from_json(value=res, data_class=self._payload_class)
        return payload

    async def async_get(self, key: KT) -> PT:
        print("get async")
        return cast(PT, None)

    def set(
        self,
        key: KT,
        payload: PT,
        options: Optional[CacheSetOptions] = None,
    ) -> Optional[bool]:
        expire: Optional[CacheSetOptionsExpire] = None
        try:
            expire = cast(CacheSetOptions, options).expire
        except AttributeError:
            try:
                expire = cast(
                    CacheSetOptions,
                    cast(ApiDefaults, self._api._defaults).cache_set_options,
                ).expire
            except AttributeError:
                pass

        payload_json = to_json(payload)
        return self._api._redis.set(
            hash_key(self._id, key=key),
            payload_json,
            ex=expire.value if expire is not None and not expire.is_in_ms else None,
            px=expire.value if expire is not None and expire.is_in_ms else None,
        )

    async def async_set(self, key: KT, payload: PT) -> Optional[bool]:
        print("set async")
        return True


class CacheItemNoKey(CacheItem[None, PT]):
    # Different signature on purpose
    def get(self) -> Optional[PT]:  # type: ignore
        return CacheItem.get(self, key=None)

    # Different signature on purpose
    async def async_get(self) -> PT:  # type: ignore
        return await CacheItem.async_get(self, key=None)

    # Different signature on purpose
    def set(self, payload: PT) -> Optional[bool]:  # type: ignore
        return CacheItem.set(self, key=None, payload=payload)

    # Different signature on purpose
    async def async_set(self, payload: PT) -> Optional[bool]:  # type: ignore
        return await CacheItem.async_set(self, key=None, payload=payload)
