# flake8: noqa
import typing
import os

if typing.TYPE_CHECKING:
    from dataclasses import dataclass
else:
    from memorix_client_redis import dataclass

from enum import Enum
from memorix_client_redis import (
    MemorixBase,
    MemorixCacheAll,
    MemorixPubSubAll,
    MemorixTaskAll,
    Value,
)


class Animal(str, Enum):
    dog = "dog"
    cat = "cat"
    person = "person"


@dataclass
class InlineTypeUser(object):
    name: str
    age: typing.Optional[int]


User: typing.TypeAlias = InlineTypeUser


class MemorixCache(MemorixCacheAll.Base):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.favoriteAnimal = MemorixCacheAll.ItemTTTT[str, "Animal"](
            api=api,
            id="favoriteAnimal",
            payload_class=Animal,
        )
        self.user = MemorixCacheAll.ItemTTTT[str, "User"](
            api=api,
            id="user",
            payload_class=User,
        )


class MemorixPubSub(MemorixPubSubAll.Base):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.message = MemorixPubSubAll.ItemTTNoKey[str](
            api=api,
            id="message",
            payload_class=str,
        )


class MemorixTask(MemorixTaskAll.Base):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.runAlgo = MemorixTaskAll.ItemTTTTNoKey[str](
            api=api,
            id="runAlgo",
            payload_class=str,
        )


class Memorix(MemorixBase):
    def __init__(self) -> None:
        super().__init__(redis_url=Value.from_env_variable("REDIS_URL"))

        self._namespace_name_tree = []
        self.cache = MemorixCache(self)
        self.pubsub = MemorixPubSub(self)
        self.task = MemorixTask(self)
