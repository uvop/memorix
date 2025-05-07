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
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
        options: typing.Optional[CacheOptions] = None,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._options = (
            options
            if options is not None
            else CacheOptions(ttl_ms=None, extend_on_get=None)
        )
        self._has_key = True

    def _key(self, key: KT) -> str:
        return hash_key(api=self._api, id=self._id, key=key, has_key=self._has_key)

    def _extend(
        self,
        key: KT,
    ) -> None:
        ttl_ms = self._options.get_ttl_ms()
        if ttl_ms == 0:
            return

        hashed_key = self._key(key=key)

        self._api._connection.redis.pexpire(
            hashed_key,
            ttl_ms,
        )

    async def _async_extend(
        self,
        key: KT,
    ) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem._extend,
                self=self,
                key=key,
            ),
        )

    def _get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        data_bytes = self._api._connection.redis.get(
            self._key(key=key),
        )
        if data_bytes is None:
            return None
        if self._options.get_extend_on_get():
            CacheItem._extend(self=self, key=key)

        data_str = bytes_to_str(data_bytes)
        payload = typing.cast(
            PT,
            from_json(value=data_str, data_class=self._payload_class),
        )
        return payload

    async def _async_get(self, key: KT) -> typing.Optional[PT]:
        loop = asyncio.get_running_loop()
        payload = await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem._get,
                self=self,
                key=key,
            ),
        )
        return payload

    def _set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        payload_json = to_json(payload)
        ttl_ms = self._options.get_ttl_ms()
        return self._api._connection.redis.set(
            self._key(key=key),
            payload_json,
            px=ttl_ms if ttl_ms != 0 else None,
        )

    async def _async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem._set,
                self=self,
                key=key,
                payload=payload,
            ),
        )
        return res

    def _delete(
        self,
        key: KT,
    ) -> None:
        self._api._connection.redis.delete(
            self._key(key=key),
        )

    async def _async_delete(
        self,
        key: KT,
    ) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem._delete,
                self=self,
                key=key,
            ),
        )

    def _expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._api._connection.redis.pexpire(
            self._key(key=key),
            ttl_ms,
        )

    async def _async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                CacheItem._expire,
                self=self,
                key=key,
                ttl_ms=ttl_ms,
            ),
        )


class CacheItemNoKey(CacheItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
        options: typing.Optional[CacheOptions] = None,
    ) -> None:
        super().__init__(api=api, id=id, payload_class=payload_class, options=options)
        self._has_key = False

    def _key_no_key(self) -> str:
        return CacheItem._key(self, key=None)

    def _extend_no_key(
        self,
    ) -> None:
        CacheItem._extend(self, key=None)

    async def _async_extend_no_key(
        self,
    ) -> None:
        await CacheItem._async_extend(
            self,
            key=None,
        )

    def _get_no_key(self) -> typing.Optional[PT]:
        return CacheItem._get(self, key=None)

    async def _async_get_no_key(self) -> typing.Optional[PT]:
        return await CacheItem._async_get(self, key=None)  # type: ignore

    def _set_no_key(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return CacheItem._set(
            self,
            key=None,
            payload=payload,
        )

    async def _async_set_no_key(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await CacheItem._async_set(
            self,
            key=None,
            payload=payload,
        )

    def _delete_no_key(
        self,
    ) -> None:
        CacheItem._delete(self, key=None)

    async def _async_delete_no_key(
        self,
    ) -> None:
        await CacheItem._async_delete(
            self,
            key=None,
        )

    def _expire_no_key(
        self,
        ttl_ms: int,
    ) -> None:
        CacheItem._expire(self, key=None, ttl_ms=ttl_ms)

    async def _async_expire_no_key(
        self,
        ttl_ms: int,
    ) -> None:
        await CacheItem._async_expire(
            self,
            key=None,
            ttl_ms=ttl_ms,
        )


class CacheItemTTTT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemTTFT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemTFTT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemTFFT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemFTTT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemFTFT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemFFTT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemFFFT(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        self._expire(key=key, ttl_ms=ttl_ms)

    async def async_expire(
        self,
        key: KT,
        ttl_ms: int,
    ) -> None:
        await self._async_expire(key=key, ttl_ms=ttl_ms)


class CacheItemTTTTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemTTFTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemTFTTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemTFFTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemFTTTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemFTFTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemFFTTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemFFFTNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def expire(
        self,
        ttl_ms: int,
    ) -> None:
        self._expire_no_key(ttl_ms=ttl_ms)

    async def async_expire(
        self,
        ttl_ms: int,
    ) -> None:
        await self._async_expire_no_key(ttl_ms=ttl_ms)


class CacheItemTTTF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)


class CacheItemTTFF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)


class CacheItemTFTF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)


class CacheItemTFFF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return self._get(key=key)

    async def async_get(
        self,
        key: KT,
    ) -> typing.Optional[PT]:
        return await self._async_get(key=key)


class CacheItemFTTF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)


class CacheItemFTFF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set(key=key, payload=payload)

    async def async_set(
        self,
        key: KT,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set(key=key, payload=payload)


class CacheItemFFTF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)

    def delete(
        self,
        key: KT,
    ) -> None:
        self._delete(key=key)

    async def async_delete(
        self,
        key: KT,
    ) -> None:
        await self._async_delete(key=key)


class CacheItemFFFF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)


class CacheItemTTTFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()


class CacheItemTTFFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)


class CacheItemTFTFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()


class CacheItemTFFFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def get(
        self,
    ) -> typing.Optional[PT]:
        return self._get_no_key()

    async def async_get(
        self,
    ) -> typing.Optional[PT]:
        return await self._async_get_no_key()


class CacheItemFTTFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()


class CacheItemFTFFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return self._set_no_key(payload=payload)

    async def async_set(
        self,
        payload: PT,
    ) -> typing.Optional[bool]:
        return await self._async_set_no_key(payload=payload)


class CacheItemFFTFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()

    def delete(
        self,
    ) -> None:
        self._delete_no_key()

    async def async_delete(
        self,
    ) -> None:
        await self._async_delete_no_key()


class CacheItemFFFFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()
