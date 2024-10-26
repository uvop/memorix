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


class PubSubItemSubscribe(typing.Generic[PT]):
    def __init__(
        self,
        payload: PT,
    ) -> None:
        self.payload = payload


class PubSubItem(typing.Generic[KT, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Type[PT],
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class

    def publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        payload_json = to_json(payload)
        subscribers_size = self._api._connection.redis.publish(
            hash_key(api=self._api, id=self._id, key=key),
            payload_json,
        )
        return PubSubItemPublish(subscribers_size=subscribers_size)

    async def async_publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None,
            functools.partial(
                PubSubItem.publish,
                self=self,
                key=key,
                payload=payload,
            ),
        )
        return res

    def subscribe(self, key: KT) -> typing.Generator[PubSubItemSubscribe[PT], None, None]:
        sub = self._api._connection.redis.pubsub()
        sub.subscribe(hash_key(api=self._api, id=self._id, key=key))
        for message in typing.cast(
            typing.Generator[typing.Dict[str, typing.Union[int, bytes]], None, None],
            sub.listen(),  # type: ignore
        ):
            data_bytes = message["data"]
            if isinstance(data_bytes, bytes):
                data_str = bytes_to_str(data_bytes)
                data = from_json(value=data_str, data_class=self._payload_class)
                yield PubSubItemSubscribe(payload=data)

    async def async_subscribe(
        self,
        key: KT,
    ) -> typing.AsyncGenerator[PubSubItemSubscribe[PT], None]:
        sub = self._api._connection.redis.pubsub()
        sub.subscribe(hash_key(api=self._api, id=self._id, key=key))
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
                    data_str = bytes_to_str(data_bytes)
                    data = from_json(value=data_str, data_class=self._payload_class)
                    yield PubSubItemSubscribe(payload=data)


class PubSubItemNoKeyPublishOnly(typing.Protocol[PT]):
    def publish(self, payload: PT) -> PubSubItemPublish: ...
    async def async_publish(self, payload: PT) -> PubSubItemPublish: ...

class PubSubItemNoKeySubscribeOnly(typing.Protocol[PT]):
    def subscribe(self) -> typing.Generator[PubSubItemSubscribe[PT], None, None]: ...
    def async_subscribe(self) -> typing.AsyncGenerator[PubSubItemSubscribe[PT], None]: ...

class PubSubItemNoKeyPublishAndSubscribe(PubSubItemNoKeyPublishOnly[PT], PubSubItemNoKeySubscribeOnly[PT], typing.Protocol[PT]):
    pass

class PubSubItemNoKeyNoMethods(typing.Protocol[PT]):
    pass

class PubSubItemNoKey(PubSubItem[None, PT]):
    def __init__(self, api: MemorixBase, id: str, payload_class: type[PT]) -> None:
        super().__init__(api=api, id=id, payload_class=payload_class)
        self._has_key = False

    @typing.overload
    def __class_getitem__(cls, params: tuple[type[PT], typing.Literal[True], typing.Literal[True]]) -> type[PubSubItemNoKeyPublishAndSubscribe[PT]]: ...

    @typing.overload
    def __class_getitem__(cls, params: tuple[type[PT], typing.Literal[True], typing.Literal[False]]) -> type[PubSubItemNoKeyPublishOnly[PT]]: ...

    @typing.overload
    def __class_getitem__(cls, params: tuple[type[PT], typing.Literal[False], typing.Literal[True]]) -> type[PubSubItemNoKeySubscribeOnly[PT]]: ...

    @typing.overload
    def __class_getitem__(cls, params: tuple[type[PT], typing.Literal[False], typing.Literal[False]]) -> type[PubSubItemNoKeyNoMethods[PT]]: ...

    def __class_getitem__(cls, params):
        return super().__class_getitem__(params[0])  # type: ignore

    def publish(self, payload: PT) -> PubSubItemPublish:  # type: ignore
        return PubSubItem.publish(self, key=None, payload=payload)

    async def async_publish(self, payload: PT) -> PubSubItemPublish:  # type: ignore
        return await PubSubItem.async_publish(self, key=None, payload=payload)

    def subscribe(self) -> Generator[PubSubItemSubscribe[PT], None, None]:  # type: ignore
        return PubSubItem.subscribe(self, key=None)

    def async_subscribe(self) -> AsyncGenerator[PubSubItemSubscribe[PT], None]:  # type: ignore
        return PubSubItem.async_subscribe(self, key=None)
