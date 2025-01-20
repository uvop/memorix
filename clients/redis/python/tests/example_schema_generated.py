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


@dataclass
class InlineCacheKeyUser2(object):
    id: str


@dataclass
class InlineCachePayloadOptionalPayload(object):
    id: str


User: typing.TypeAlias = InlineTypeUser


class Spaceship(object):
    @dataclass
    class InlineTypePilotData(object):
        name: str

    PilotData: typing.TypeAlias = InlineTypePilotData

    class Crew(object):
        class MemorixCache(MemorixCacheAll.Base):
            def __init__(self, api: MemorixBase) -> None:
                super().__init__(api=api)

                self.count = MemorixCacheAll.ItemTTTTNoKey[int](
                    api=api,
                    id="count",
                    payload_class=int,
                    options=MemorixCacheAll.Options(
                        ttl_ms=Value.from_string("1000"),
                    ),
                )

        class Memorix(MemorixBase):
            def __init__(self, ref: MemorixBase) -> None:
                super().__init__(ref=ref)

                self._namespace_name_tree = ["spaceship", "crew"]
                self.cache = Spaceship.Crew.MemorixCache(self)

    class MemorixCache(MemorixCacheAll.Base):
        def __init__(self, api: MemorixBase) -> None:
            super().__init__(api=api)

            self.pilot = MemorixCacheAll.ItemTTTTNoKey["Spaceship.PilotData"](
                api=api,
                id="pilot",
                payload_class=Spaceship.PilotData,
                options=MemorixCacheAll.Options(
                    ttl_ms=Value.from_string("1000"),
                ),
            )

    class Memorix(MemorixBase):
        def __init__(self, ref: MemorixBase) -> None:
            super().__init__(ref=ref)

            self._namespace_name_tree = ["spaceship"]
            self.crew = Spaceship.Crew.Memorix(ref=self)

            self.cache = Spaceship.MemorixCache(self)


class MemorixCache(MemorixCacheAll.Base):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.bestStr = MemorixCacheAll.ItemTTTTNoKey[str](
            api=api,
            id="bestStr",
            payload_class=str,
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("2000"),
            ),
        )
        self.allUsers = MemorixCacheAll.ItemTTTTNoKey[
            typing.List[typing.List[typing.Optional["User"]]]
        ](
            api=api,
            id="allUsers",
            payload_class=typing.List[typing.List[typing.Optional[User]]],
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("2000"),
            ),
        )
        self.favoriteAnimal = MemorixCacheAll.ItemTTTT[str, "Animal"](
            api=api,
            id="favoriteAnimal",
            payload_class=Animal,
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("2000"),
            ),
        )
        self.user = MemorixCacheAll.ItemTTTT[str, "User"](
            api=api,
            id="user",
            payload_class=User,
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("2000"),
            ),
        )
        self.user2 = MemorixCacheAll.ItemTTTT["InlineCacheKeyUser2", "User"](
            api=api,
            id="user2",
            payload_class=User,
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("2000"),
            ),
        )
        self.userExpire = MemorixCacheAll.ItemTTTT[str, "User"](
            api=api,
            id="userExpire",
            payload_class=User,
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("1000"),
            ),
        )
        self.userExpire2 = MemorixCacheAll.ItemTTTT[str, "User"](
            api=api,
            id="userExpire2",
            payload_class=User,
        )
        self.userExpire3 = MemorixCacheAll.ItemTTTTNoKey["User"](
            api=api,
            id="userExpire3",
            payload_class=User,
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("2000"),
                extend_on_get=Value.from_string("true"),
            ),
        )
        self.optionalPayload = MemorixCacheAll.ItemTTTTNoKey[
            typing.Optional["InlineCachePayloadOptionalPayload"]
        ](
            api=api,
            id="optionalPayload",
            payload_class=typing.Optional[InlineCachePayloadOptionalPayload],
            options=MemorixCacheAll.Options(
                ttl_ms=Value.from_string("2000"),
            ),
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
        self.runAlgoOptional = MemorixTaskAll.ItemTTTTNoKey[typing.Optional[str]](
            api=api,
            id="runAlgoOptional",
            payload_class=typing.Optional[str],
        )
        self.runAlgoNewest = MemorixTaskAll.ItemTTTTNoKey[str](
            api=api,
            id="runAlgoNewest",
            payload_class=str,
            options=MemorixTaskAll.Options(
                queue_type=Value.from_string("lifo"),
            ),
        )


class Memorix(MemorixBase):
    def __init__(self) -> None:
        super().__init__(redis_url=Value.from_env_variable("REDIS_URL"))

        self._namespace_name_tree = []
        self.spaceship = Spaceship.Memorix(ref=self)

        self.cache = MemorixCache(self)
        self.pubsub = MemorixPubSub(self)
        self.task = MemorixTask(self)
