import asyncio
import functools
from memorix_client_redis.features.api.hash_key import hash_key
from memorix_client_redis.features.api.json import from_json, to_json, bytes_to_str
from typing import Generic, Optional, Type, TypeVar, cast
from ..api import Api, ApiDefaults
from .cache_options import CacheSetOptions

KT = TypeVar("KT")
PT = TypeVar("PT")


class CacheItem(Generic[KT, PT]):
    def __init__(
        self,
        api: Api,
        id: str,
        payload_class: Type[PT],
        options: Optional[CacheSetOptions] = None,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._options = options

    def get(self, key: KT) -> Optional[PT]:
        data_bytes = self._api._redis.get(hash_key(self._id, key=key))
        if data_bytes is None:
            return None

        data_str = bytes_to_str(data_bytes)
        payload = from_json(value=data_str, data_class=self._payload_class)
        return payload

    async def async_get(self, key: KT) -> Optional[PT]:
        loop = asyncio.get_running_loop()
        payload = await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem.get,
                self=self,
                key=key,
            ),
        )
        return payload

    def set(
        self,
        key: KT,
        payload: PT,
        options: Optional[CacheSetOptions] = None,
    ) -> Optional[bool]:
        merged_options = self._options
        try:
            merged_options = CacheSetOptions.merge(
                cast(ApiDefaults, self._api._defaults).cache_set_options,
                self._options,
            )
        except AttributeError:
            pass
        merged_options = CacheSetOptions.merge(
            merged_options,
            options,
        )

        payload_json = to_json(payload)
        return self._api._redis.set(
            hash_key(self._id, key=key),
            payload_json,
            ex=merged_options.expire.value
            if merged_options is not None
            and merged_options.expire is not None
            and not merged_options.expire.is_in_ms
            else None,
            px=merged_options.expire.value
            if merged_options is not None
            and merged_options.expire is not None
            and merged_options.expire.is_in_ms
            else None,
        )

    async def async_set(
        self,
        key: KT,
        payload: PT,
        options: Optional[CacheSetOptions] = None,
    ) -> Optional[bool]:
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem.set,
                self=self,
                key=key,
                payload=payload,
                options=options,
            ),
        )
        return res


class CacheItemNoKey(CacheItem[None, PT]):
    # Different signature on purpose
    def get(self) -> Optional[PT]:  # type: ignore
        return CacheItem.get(self, key=None)

    # Different signature on purpose
    async def async_get(self) -> Optional[PT]:  # type: ignore
        casted_self = cast(CacheItem[None, Optional[PT]], self)  # Not sure why needed
        return await CacheItem.async_get(casted_self, key=None)

    # Different signature on purpose
    def set(  # type: ignore
        self,
        payload: PT,
        options: Optional[CacheSetOptions] = None,
    ) -> Optional[bool]:
        return CacheItem.set(self, key=None, payload=payload, options=options)

    # Different signature on purpose
    async def async_set(  # type: ignore
        self,
        payload: PT,
        options: Optional[CacheSetOptions] = None,
    ) -> Optional[bool]:
        return await CacheItem.async_set(
            self,
            key=None,
            payload=payload,
            options=options,
        )
