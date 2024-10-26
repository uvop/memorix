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
    MemorixCacheBase,
    MemorixCacheItem,
    MemorixCacheItemNoKey,
    MemorixPubSubBase,
    MemorixPubSubItem,
    MemorixPubSubItemNoKey,
    MemorixTaskBase,
    MemorixTaskItem,
    MemorixTaskItemNoKey,
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

        class MemorixCache(MemorixCacheBase):
            def __init__(self, api: MemorixBase) -> None:
                super().__init__(api=api)

                self.count = MemorixCacheItemNoKey[int](
                    api=api,
                    id="count",
                    payload_class=int,
                    options=MemorixCacheItem.Options(
                        ttl='1',
                    )
                )

        class Memorix(MemorixBase):
            def __init__(self, ref: MemorixBase) -> None:
                super().__init__(ref=ref)


                self._namespace_name_tree = ["spaceship", "crew"]
                self.cache = Spaceship.Crew.MemorixCache(self)


    class MemorixCache(MemorixCacheBase):
        def __init__(self, api: MemorixBase) -> None:
            super().__init__(api=api)

            self.pilot = MemorixCacheItemNoKey[Spaceship.InlineCachePayloadPilot](
                api=api,
                id="pilot",
                payload_class=Spaceship.InlineCachePayloadPilot,
                options=MemorixCacheItem.Options(
                    ttl='1',
                )
            )

    class Memorix(MemorixBase):
        def __init__(self, ref: MemorixBase) -> None:
            super().__init__(ref=ref)


            self._namespace_name_tree = ["spaceship"]
            self.crew = Spaceship.Crew.Memorix(ref=self)

            self.cache = Spaceship.MemorixCache(self)


class MemorixCache(MemorixCacheBase):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.bestStr = MemorixCacheItemNoKey[str](
            api=api,
            id="bestStr",
            payload_class=str,
            options=MemorixCacheItem.Options(
                ttl='2',
            )
        )
        self.allUsers = MemorixCacheItemNoKey[typing.List[typing.List[typing.Optional[User]]]](
            api=api,
            id="allUsers",
            payload_class=typing.List[typing.List[typing.Optional[User]]],
            options=MemorixCacheItem.Options(
                ttl='2',
            )
        )
        self.favoriteAnimal = MemorixCacheItem[str, Animal](
            api=api,
            id="favoriteAnimal",
            payload_class=Animal,
            options=MemorixCacheItem.Options(
                ttl='2',
            )
        )
        self.user = MemorixCacheItem[str, User](
            api=api,
            id="user",
            payload_class=User,
            options=MemorixCacheItem.Options(
                ttl='2',
            )
        )
        self.user2 = MemorixCacheItem[InlineCacheKeyUser2, User](
            api=api,
            id="user2",
            payload_class=User,
            options=MemorixCacheItem.Options(
                ttl='2',
            )
        )
        self.userExpire = MemorixCacheItem[str, User](
            api=api,
            id="userExpire",
            payload_class=User,
            options=MemorixCacheItem.Options(
                ttl='1',
            )
        )
        self.userExpire2 = MemorixCacheItem[str, User](
            api=api,
            id="userExpire2",
            payload_class=User,
        )
        self.userExpire3 = MemorixCacheItemNoKey[User](
            api=api,
            id="userExpire3",
            payload_class=User,
            options=MemorixCacheItem.Options(
                ttl='2',
                extend_on_get='true',
            )
        )


class MemorixPubSub(MemorixPubSubBase):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.message = MemorixPubSubItemNoKey[str, True, False](
            api=api,
            id="message",
            payload_class=str,
        )


class MemorixTask(MemorixTaskBase):
    def __init__(self, api: MemorixBase) -> None:
        super().__init__(api=api)

        self.runAlgo = MemorixTaskItemNoKey[str](
            api=api,
            id="runAlgo",
            payload_class=str,
        )
        self.runAlgoNewest = MemorixTaskItemNoKey[str](
            api=api,
            id="runAlgoNewest",
            payload_class=str,
            options=MemorixTaskItem.Options(
                queue_type='lifo',
            )
        )

class Memorix(MemorixBase):
    def __init__(self) -> None:
        super().__init__(redis_url=os.environ['REDIS_URL'])


        self._namespace_name_tree = []
        self.spaceship = Spaceship.Memorix(ref=self)

        self.cache = MemorixCache(self)
        self.pubsub = MemorixPubSub(self)
        self.task = MemorixTask(self)
