import asyncio
import functools
from memorix_client_redis.hash_key import hash_key
from memorix_client_redis.json import from_json, to_json, bytes_to_str
from memorix_client_redis.memorix_base import MemorixBase
import typing

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")


class PubSubItemPublish(object):
    def __init__(
        self,
        subscribers_size: int,
    ) -> None:
        self.subscribers_size = subscribers_size


class PubSubItem(typing.Generic[KT, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._has_key = True

    def _key(self, key: KT) -> str:
        return hash_key(api=self._api, id=self._id, has_key=self._has_key, key=key)

    def _publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        payload_json = to_json(payload)
        subscribers_size = self._api._connection.redis.publish(
            self._key(key=key),
            payload_json,
        )
        return PubSubItemPublish(subscribers_size=subscribers_size)

    async def _async_publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None,
            functools.partial(
                PubSubItem._publish,
                self=self,
                key=key,
                payload=payload,
            ),
        )
        return res

    def _subscribe(self, key: KT) -> typing.Generator[PT, None, None]:
        sub = self._api._connection.redis.pubsub()
        sub.subscribe(self._key(key=key))
        for message in typing.cast(
            typing.Generator[typing.Dict[str, typing.Union[int, bytes]], None, None],
            sub.listen(),  # type: ignore
        ):
            data_bytes = message["data"]
            if isinstance(data_bytes, bytes):
                payload_str = bytes_to_str(data_bytes)
                payload = typing.cast(
                    PT,
                    from_json(value=payload_str, data_class=self._payload_class),
                )
                yield payload

    async def _async_subscribe(
        self,
        key: KT,
    ) -> typing.AsyncGenerator[PT, None]:
        sub = self._api._connection.redis.pubsub()
        sub.subscribe(self._key(key=key))
        loop = asyncio.get_running_loop()
        while True:
            message = await loop.run_in_executor(
                None,
                functools.partial(
                    sub.get_message,
                    ignore_subscribe_messages=True,
                ),
            )
            if message is not None:
                data_bytes = message["data"]
                if isinstance(data_bytes, bytes):
                    payload_str = bytes_to_str(data_bytes)
                    payload = typing.cast(
                        PT,
                        from_json(value=payload_str, data_class=self._payload_class),
                    )
                    yield payload


class PubSubItemTT(PubSubItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        return self._publish(key=key, payload=payload)

    async def async_publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        return await self._async_publish(key=key, payload=payload)

    def subscribe(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._subscribe(key=key)

    async def async_subscribe(
        self,
        key: KT,
    ) -> typing.AsyncGenerator[PT, None]:
        return self._async_subscribe(key=key)


class PubSubItemTF(PubSubItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        return self._publish(key=key, payload=payload)

    async def async_publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        return await self._async_publish(key=key, payload=payload)


class PubSubItemFT(PubSubItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)

    def subscribe(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._subscribe(key=key)

    async def async_subscribe(
        self,
        key: KT,
    ) -> typing.AsyncGenerator[PT, None]:
        return self._async_subscribe(key=key)


class PubSubItemFF(PubSubItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key)


class PubSubItemTTNoKey(PubSubItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
    ) -> None:
        super().__init__(api=api, id=id, payload_class=payload_class)
        self._has_key = False

    def key(self) -> str:
        return PubSubItem._key(self, key=None)

    def publish(self, payload: PT) -> PubSubItemPublish:
        return PubSubItem._publish(self, key=None, payload=payload)

    async def async_publish(self, payload: PT) -> PubSubItemPublish:
        return await PubSubItem._async_publish(self, key=None, payload=payload)

    def subscribe(self) -> typing.Generator[PT, None, None]:
        return PubSubItem._subscribe(self, key=None)

    def async_subscribe(self) -> typing.AsyncGenerator[PT, None]:
        return PubSubItem._async_subscribe(self, key=None)


class PubSubItemTFNoKey(PubSubItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
    ) -> None:
        super().__init__(api=api, id=id, payload_class=payload_class)
        self._has_key = False

    def key(self) -> str:
        return PubSubItem._key(self, key=None)

    def publish(self, payload: PT) -> PubSubItemPublish:
        return PubSubItem._publish(self, key=None, payload=payload)

    async def async_publish(self, payload: PT) -> PubSubItemPublish:
        return await PubSubItem._async_publish(self, key=None, payload=payload)


class PubSubItemFTNoKey(PubSubItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
    ) -> None:
        super().__init__(api=api, id=id, payload_class=payload_class)
        self._has_key = False

    def key(self) -> str:
        return PubSubItem._key(self, key=None)

    def subscribe(self) -> typing.Generator[PT, None, None]:
        return PubSubItem._subscribe(self, key=None)

    def async_subscribe(self) -> typing.AsyncGenerator[PT, None]:
        return PubSubItem._async_subscribe(self, key=None)


class PubSubItemFFNoKey(PubSubItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
    ) -> None:
        super().__init__(api=api, id=id, payload_class=payload_class)
        self._has_key = False

    def key(self) -> str:
        return PubSubItem._key(self, key=None)
