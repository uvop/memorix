# flake8: noqa
import typing

if typing.TYPE_CHECKING:
    from dataclasses import dataclass
else:
    from memorix_client_redis import dataclass

from enum import Enum
from memorix_client_redis import (
    MemorixBase,
    MemorixCacheBase,
    MemorixCacheItem,
    MemorixCacheItemNoKey,
    MemorixPubSubBase,
    MemorixPubSubItem,
    MemorixPubSubItemNoKey,
    MemorixTaskBase,
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


class MemorixCache(MemorixCacheBase):
    def __init__(self, api: MemorixBase) -> None:
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


class MemorixPubSub(MemorixPubSubBase):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.message = MemorixPubSubItemNoKey[str](
            api=api,
            id="message",
            payload_class=str,
        )


class MemorixTask(MemorixTaskBase):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.runAlgo = MemorixTaskItemNoKey[str, "Animal"](
            api=api,
            id="runAlgo",
            payload_class=str,
            returns_class=Animal,
        )


class Memorix(MemorixBase):
    def __init__(
        self,
        redis_url: str,
        ref: typing.Optional[MemorixBase] = None,
    ) -> None:
        super().__init__(redis_url=redis_url, ref=ref)

        self._namespace_name_tree = []

        self.cache = MemorixCache(self)
        self.pubsub = MemorixPubSub(self)
        self.task = MemorixTask(self)
