import asyncio
import functools
from memorix_client_redis.hash_key import hash_key
from memorix_client_redis.json import from_json, to_json, bytes_to_str
import typing
from memorix_client_redis.memorix_base import MemorixBase
from .cache_options import CacheOptions

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")


class CacheItem(typing.Generic[KT, PT]):
    Options = CacheOptions

    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Type[PT],
        options: typing.Optional[CacheOptions] = None,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._options = options

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        data_bytes = self._api._connection.redis.get(
            hash_key(api=self._api, id=self._id, key=key),
        )
        if data_bytes is None:
            return None
        if (
            self._options is not None
            and self._options.extend_on_get is not None
            and self._options.extend_on_get == "true"
        ):
            CacheItem.extend(self=self, key=key)

        data_str = bytes_to_str(data_bytes)
        payload = from_json(value=data_str, data_class=self._payload_class)
        return payload

    async def async_get(self, key: KT) -> typing.Optional[PT]:
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
    ) -> typing.Optional[bool]:
        payload_json = to_json(payload)
        return self._api._connection.redis.set(
            hash_key(api=self._api, id=self._id, key=key),
            payload_json,
            ex=int(self._options.ttl)
            if self._options is not None
            and self._options.ttl is not None
            and self._options.ttl != "0"
            else None,
        )

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem.set,
                self=self,
                key=key,
                payload=payload,
            ),
        )
        return res

    def extend(
        self,
        key: KT,
    ) -> None:
        if self._options is None or self._options.ttl is None or self._options.ttl == "0":
            return
        ttl = int(self._options.ttl)

        hashed_key = hash_key(api=self._api, id=self._id, key=key)

        self._api._connection.redis.expire(
            hashed_key,
            ttl,
        )

    async def async_extend(
        self,
        key: KT,
    ) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem.extend,
                self=self,
                key=key,
            ),
        )


class CacheItemNoKey(CacheItem[None, PT]):
    # Different signature on purpose
    def get(self) -> Optional[PT]:  # type: ignore
        return CacheItem.get(self, key=None)

    # Different signature on purpose
    async def async_get(self) -> typing.Optional[PT]:  # type: ignore
        casted_self = typing.cast(CacheItem[None, typing.Optional[PT]], self)  # Not sure why needed
        return await CacheItem.async_get(casted_self, key=None)

    # Different signature on purpose
    def set(  # type: ignore
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return CacheItem.set(self, key=None, payload=payload)

    # Different signature on purpose
    async def async_set(  # type: ignore
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await CacheItem.async_set(
            self,
            key=None,
            payload=payload,
        )

    # Different signature on purpose
    def extend(  # type: ignore
        self,
    ) -> None:
        CacheItem.extend(self, key=None)

    # Different signature on purpose
    async def async_extend(  # type: ignore
        self,
    ) -> None:
        await CacheItem.async_extend(
            self,
            key=None,
        )
