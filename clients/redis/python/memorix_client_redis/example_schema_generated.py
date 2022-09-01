import typing
from enum import Enum
from memorix_client_redis import (
    dataclass,
    MemorixClientApi,
    MemorixClientCacheApi,
    MemorixClientCacheApiItem,
    MemorixClientPubSubApi,
    # MemorixClientPubSubApiItem,
    MemorixClientPubSubApiItemNoKey,
    MemorixClientTaskApi,
    # MemorixClientTaskApiItem,
    MemorixClientTaskApiItemNoKey,
)


class Animal(Enum):
    dog = "dog"
    cat = "cat"
    person = "person"


@dataclass
class User(object):
    name: str
    age: typing.Optional[int]


class MemorixCacheApi(MemorixClientCacheApi):
    def __init__(self, api: MemorixClientApi) -> None:
        super().__init__(api=api)

        self.favoriteAnimal = MemorixClientCacheApiItem[str, Animal](
            cache_api=self,
            id="favoriteAnimal",
            payload_class=Animal,
        )
        self.user = MemorixClientCacheApiItem[str, User](
            cache_api=self,
            id="user",
            payload_class=User,
        )


class MemorixPubsubApi(MemorixClientPubSubApi):
    def __init__(self, api: MemorixClientApi) -> None:
        super().__init__(api=api)

        self.message = MemorixClientPubSubApiItemNoKey[str](
            pubsub_api=self,
            id="message",
            payload_class=str,
        )


class MemorixTaskApi(MemorixClientTaskApi):
    def __init__(self, api: MemorixClientApi) -> None:
        super().__init__(api=api)

        self.runAlgo = MemorixClientTaskApiItemNoKey[str, Animal](
            task_api=self,
            id="runAlgo",
        )


class MemorixApi(MemorixClientApi):
    def __init__(self, redis_url: str) -> None:
        super().__init__(redis_url=redis_url)

        self.cache = MemorixCacheApi(self)
        self.pubsub = MemorixPubsubApi(self)
        self.task = MemorixTaskApi(self)
