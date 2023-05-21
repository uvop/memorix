# flake8: noqa
import typing

if typing.TYPE_CHECKING:
    from dataclasses import dataclass
else:
    from memorix_client_redis import dataclass

from enum import Enum
from memorix_client_redis import (
    MemorixBaseApi,
    MemorixBaseCacheApi,
    MemorixCacheItem,
    MemorixCacheItemNoKey,
    MemorixBasePubSubApi,
    MemorixPubSubItem,
    MemorixPubSubItemNoKey,
    MemorixBaseTaskApi,
    MemorixTaskItem,
    MemorixTaskItemNoKey,
    MemorixTaskItemNoReturns,
    MemorixTaskItemNoKeyNoReturns,
)


class Animal(str, Enum):
    dog = "dog"
    cat = "cat"
    person = "person"


@dataclass
class User(object):
    name: str
    age: typing.Optional[int]


class MemorixCacheApi(MemorixBaseCacheApi):
    def __init__(self, api: MemorixBaseApi) -> None:
        super().__init__(api=api)

        self.favoriteAnimal = MemorixCacheItem[str, "Animal"](
            api=api,
            id="favoriteAnimal",
            payload_class=Animal,
        )
        self.user = MemorixCacheItem[str, "User"](
            api=api,
            id="user",
            payload_class=User,
        )


class MemorixPubSubApi(MemorixBasePubSubApi):
    def __init__(self, api: MemorixBaseApi) -> None:
        super().__init__(api=api)

        self.message = MemorixPubSubItemNoKey[str](
            api=api,
            id="message",
            payload_class=str,
        )


class MemorixTaskApi(MemorixBaseTaskApi):
    def __init__(self, api: MemorixBaseApi) -> None:
        super().__init__(api=api)

        self.runAlgo = MemorixTaskItemNoKey[str, "Animal"](
            api=api,
            id="runAlgo",
            payload_class=str,
            returns_class=Animal,
        )


class MemorixApi(MemorixBaseApi):
    def __init__(
        self,
        redis_url: str,
    ) -> None:
        super().__init__(redis_url=redis_url)

        self.cache = MemorixCacheApi(self)
        self.pubsub = MemorixPubSubApi(self)
        self.task = MemorixTaskApi(self)
