import asyncio
import functools
from memorix_client_redis.hash_key import hash_key_better
from memorix_client_redis.json import from_json, to_json, bytes_to_str
from memorix_client_redis.memorix_base import MemorixBase
from typing import AsyncGenerator, Dict, Generator, Generic, Type, TypeVar, Union, cast

KT = TypeVar("KT")
PT = TypeVar("PT")


class PubSubItemPublish(object):
    def __init__(
        self,
        subscribers_size: int,
    ) -> None:
        self.subscribers_size = subscribers_size


class PubSubItemSubscribe(Generic[PT]):
    def __init__(
        self,
        payload: PT,
    ) -> None:
        self.payload = payload


class PubSubItem(Generic[KT, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: Type[PT],
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._has_key = True

    def publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        payload_json = to_json(payload)
        subscribers_size = self._api._connection.redis.publish(
            hash_key_better(api=self._api, id=self._id, has_key=self._has_key, key=key),
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

    def subscribe(self, key: KT) -> Generator[PubSubItemSubscribe[PT], None, None]:
        sub = self._api._connection.redis.pubsub()
        sub.subscribe(
            hash_key_better(
                api=self._api,
                id=self._id,
                has_key=self._has_key,
                key=key,
            ),
        )
        for message in cast(
            Generator[Dict[str, Union[int, bytes]], None, None],
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
    ) -> AsyncGenerator[PubSubItemSubscribe[PT], None]:
        sub = self._api._connection.redis.pubsub()
        sub.subscribe(
            hash_key_better(
                api=self._api,
                id=self._id,
                has_key=self._has_key,
                key=key,
            ),
        )
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


class PubSubItemNoKey(PubSubItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: Type[PT],
    ) -> None:
        super().__init__(
            api=api,
            id=id,
            payload_class=payload_class,
        )
        self._has_key = False

    # Different signature on purpose
    def publish(self, payload: PT) -> PubSubItemPublish:  # type: ignore
        return PubSubItem.publish(self, key=None, payload=payload)

    # Different signature on purpose
    async def async_publish(self, payload: PT) -> PubSubItemPublish:  # type: ignore
        return await PubSubItem.async_publish(self, key=None, payload=payload)

    # Different signature on purpose
    def subscribe(self) -> Generator[PubSubItemSubscribe[PT], None, None]:  # type: ignore
        return PubSubItem.subscribe(self, key=None)

    # Different signature on purpose
    def async_subscribe(self) -> AsyncGenerator[PubSubItemSubscribe[PT], None]:  # type: ignore
        return PubSubItem.async_subscribe(self, key=None)
