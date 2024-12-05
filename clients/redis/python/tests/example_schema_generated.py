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


User = InlineTypeUser


class Spaceship(object):
    @dataclass
    class InlineCachePayloadPilot(object):
        name: str

    class Crew(object):
        class MemorixCache(MemorixCacheAll.Base):
            def __init__(self, api: MemorixBase) -> None:
                super().__init__(api=api)

                self.count = MemorixCacheAll.ItemTTTTNoKey[int](
                    api=api,
                    id="count",
                    payload_class=int,
                    options=MemorixCacheAll.Options(
                        ttl="1",
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

            self.pilot = MemorixCacheAll.ItemTTTTNoKey[
                "Spaceship.InlineCachePayloadPilot"
            ](
                api=api,
                id="pilot",
                payload_class=Spaceship.InlineCachePayloadPilot,
                options=MemorixCacheAll.Options(
                    ttl="1",
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
                ttl="2",
            ),
        )
        self.allUsers = MemorixCacheAll.ItemTTTTNoKey[
            typing.List[typing.List[typing.Optional["User"]]]
        ](
            api=api,
            id="allUsers",
            payload_class=typing.List[typing.List[typing.Optional[User]]],
            options=MemorixCacheAll.Options(
                ttl="2",
            ),
        )
        self.favoriteAnimal = MemorixCacheAll.ItemTTTT[str, Animal](
            api=api,
            id="favoriteAnimal",
            payload_class=Animal,
            options=MemorixCacheAll.Options(
                ttl="2",
            ),
        )
        self.user = MemorixCacheAll.ItemTTTT[str, "User"](
            api=api,
            id="user",
            payload_class=User,
            options=MemorixCacheAll.Options(
                ttl="2",
            ),
        )
        self.user2 = MemorixCacheAll.ItemTTTT["InlineCacheKeyUser2", "User"](
            api=api,
            id="user2",
            payload_class=User,
            options=MemorixCacheAll.Options(
                ttl="2",
            ),
        )
        self.userExpire = MemorixCacheAll.ItemTTTT[str, "User"](
            api=api,
            id="userExpire",
            payload_class=User,
            options=MemorixCacheAll.Options(
                ttl="1",
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
                ttl="2",
                extend_on_get="true",
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
        self.runAlgoNewest = MemorixTaskAll.ItemTTTTNoKey[str](
            api=api,
            id="runAlgoNewest",
            payload_class=str,
            options=MemorixTaskAll.Options(
                queue_type="lifo",
            ),
        )


class Memorix(MemorixBase):
    def __init__(self) -> None:
        super().__init__(redis_url=os.environ["REDIS_URL"])

        self._namespace_name_tree = []
        self.spaceship = Spaceship.Memorix(ref=self)

        self.cache = MemorixCache(self)
        self.pubsub = MemorixPubSub(self)
        self.task = MemorixTask(self)
