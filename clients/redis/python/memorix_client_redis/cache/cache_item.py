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
        payload_class: typing.Type[PT],
        options: typing.Optional[CacheOptions] = None,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._options = options
        self._has_key = True

    def _key(self, key: KT) -> str:
        return hash_key(api=self._api, id=self._id, key=key, has_key=self._has_key)

    def _extend(
        self,
        key: KT,
    ) -> None:
        if (
            self._options is None
            or self._options.ttl is None
            or self._options.ttl == "0"
        ):
            return
        ttl = int(self._options.ttl)

        hashed_key = self._key(key=key)

        self._api._connection.redis.expire(
            hashed_key,
            ttl,
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
        if (
            self._options is not None
            and self._options.extend_on_get is not None
            and self._options.extend_on_get == "true"
        ):
            CacheItem._extend(self=self, key=key)

        data_str = bytes_to_str(data_bytes)
        payload = from_json(value=data_str, data_class=self._payload_class)
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
        return self._api._connection.redis.set(
            self._key(key=key),
            payload_json,
            ex=int(self._options.ttl)
            if self._options is not None
            and self._options.ttl is not None
            and self._options.ttl != "0"
            else None,
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


class CacheItemTTT(CacheItem[KT, PT]):
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


class CacheItemTTF(CacheItem[KT, PT]):
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


class CacheItemTFT(CacheItem[KT, PT]):
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


class CacheItemTFF(CacheItem[KT, PT]):
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


class CacheItemFTT(CacheItem[KT, PT]):
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


class CacheItemFTF(CacheItem[KT, PT]):
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


class CacheItemFFT(CacheItem[KT, PT]):
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


class CacheItemFFF(CacheItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def extend(self, key: KT) -> None:
        self._extend(key)

    async def async_extend(self, key: KT) -> None:
        await self._async_extend(key)


class CacheItemNoKey(CacheItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Type[PT],
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


class CacheItemTTTNoKey(CacheItemNoKey[PT]):
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


class CacheItemTTFNoKey(CacheItemNoKey[PT]):
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


class CacheItemTFTNoKey(CacheItemNoKey[PT]):
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


class CacheItemTFFNoKey(CacheItemNoKey[PT]):
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


class CacheItemFTTNoKey(CacheItemNoKey[PT]):
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


class CacheItemFTFNoKey(CacheItemNoKey[PT]):
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


class CacheItemFFTNoKey(CacheItemNoKey[PT]):
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


class CacheItemFFFNoKey(CacheItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def extend(self) -> None:
        self._extend_no_key()

    async def async_extend(self) -> None:
        await self._async_extend_no_key()
