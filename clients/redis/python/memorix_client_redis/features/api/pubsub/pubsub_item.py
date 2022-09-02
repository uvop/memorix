from memorix_client_redis.features.api.hash_key import hash_key
from memorix_client_redis.features.api.json import from_json, to_json
from ..api import Api
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
        api: Api,
        id: str,
        payload_class: Type[PT],
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class

    def publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        payload_json = to_json(payload)
        subscribers_size = self._api._redis.publish(
            hash_key(self._id, key=key),
            payload_json,
        )
        return PubSubItemPublish(subscribers_size=subscribers_size)

    async def async_publish(self, key: KT, payload: PT) -> PubSubItemPublish:
        print("publish async")
        return PubSubItemPublish(subscribers_size=0)

    def subscribe(self, key: KT) -> Generator[PubSubItemSubscribe[PT], None, None]:
        sub = self._api._redis.pubsub()
        sub.subscribe(hash_key(self._id, key=key))
        for message in cast(Generator[Dict[str, Union[int, bytes]], None, None], sub.listen()):  # type: ignore
            data_bytes = message["data"]
            if isinstance(data_bytes, bytes):
                data = from_json(value=data_bytes, data_class=self._payload_class)
                yield PubSubItemSubscribe(payload=data)

    async def async_subscribe(
        self,
        key: KT,
    ) -> AsyncGenerator[PubSubItemSubscribe[PT], None]:
        print("subscribe async")
        yield cast(PubSubItemSubscribe[PT], None)


class PubSubItemNoKey(PubSubItem[None, PT]):
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
    async def async_subscribe(self) -> AsyncGenerator[PubSubItemSubscribe[PT], None]:  # type: ignore
        return PubSubItem.async_subscribe(self, key=None)
