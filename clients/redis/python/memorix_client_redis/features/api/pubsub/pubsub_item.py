from memorix_client_redis.features.api.hash_key import hash_key
from memorix_client_redis.features.api.json import from_json, to_json
from .pubsub_api import PubSubApi
from typing import AsyncGenerator, Dict, Generator, Generic, Type, TypeVar, cast

KT = TypeVar("KT")
PT = TypeVar("PT")


class PubSubItem(Generic[KT, PT]):
    def __init__(
        self,
        pubsub_api: PubSubApi,
        id: str,
        payload_class: Type[PT],
    ) -> None:
        self._pubsub_api = pubsub_api
        self._id = id
        self._payload_class = payload_class

    def publish(self, key: KT, payload: PT) -> int:
        payload_json = to_json(payload)
        return self._pubsub_api._api._redis.publish(
            hash_key(self._id, key=key),
            payload_json,
        )

    async def async_publish(self, key: KT, payload: PT) -> int:
        print("publish async")
        return 0

    def subscribe(self, key: KT) -> Generator[PT, None, None]:
        sub = self._pubsub_api._api._redis.pubsub()
        sub.subscribe(hash_key(self._id, key=key))
        for message in cast(Generator[Dict[str, int | bytes], None, None], sub.listen()):  # type: ignore
            data_bytes = message["data"]
            if isinstance(data_bytes, bytes):
                data = from_json(value=data_bytes, data_class=self._payload_class)
                yield data

    async def async_subscribe(self, key: KT) -> AsyncGenerator[PT, None]:
        print("subscribe async")
        yield cast(PT, None)


class PubSubItemNoKey(PubSubItem[None, PT]):
    # Different signature on purpose
    def publish(self, payload: PT) -> int:  # type: ignore
        return PubSubItem.publish(self, key=None, payload=payload)

    # Different signature on purpose
    async def async_publish(self, payload: PT) -> int:  # type: ignore
        return await PubSubItem.async_publish(self, key=None, payload=payload)

    # Different signature on purpose
    def subscribe(self) -> Generator[PT, None, None]:  # type: ignore
        return PubSubItem.subscribe(self, key=None)

    # Different signature on purpose
    async def async_subscribe(self) -> AsyncGenerator[PT, None]:  # type: ignore
        return PubSubItem.async_subscribe(self, key=None)
