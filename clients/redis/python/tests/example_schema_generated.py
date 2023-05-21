# flake8: noqa
import typing

if typing.TYPE_CHECKING:
    from dataclasses import dataclass
else:
    from memorix_client_redis import dataclass

from enum import Enum
from memorix_client_redis import (
    MemorixBaseApi,
    MemorixNamespace,
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


@dataclass
class CacheUser2Key(object):
    id: str


@dataclass
class CachePilotPayload(object):
    name: str


class MemorixSpaceshipCacheApi(MemorixBaseCacheApi):
    def __init__(self, api: MemorixBaseApi) -> None:
        super().__init__(api=api)

        self.pilot = MemorixCacheItemNoKey["CachePilotPayload"](
            api=api,
            id="pilot",
            payload_class=CachePilotPayload,
        )


class MemorixSpaceshipNamespace(
    MemorixNamespace.with_data(  # type: ignore
        data=MemorixNamespace.NamespaceApiWithData(
            name="spaceship",
            default_options=MemorixBaseApi.BaseApiWithGlobalData.DefaultOptions(
                cache=MemorixCacheItem.Options(
                    expire=MemorixCacheItem.Options.Expire(
                        value=1,
                    ),
                ),
            ),
        ),
    )
):
    def __init__(
        self,
        api: MemorixBaseApi,
    ) -> None:
        super().__init__(connection=api._connection)

        self.cache = MemorixSpaceshipCacheApi(self)


class MemorixCacheApi(MemorixBaseCacheApi):
    def __init__(self, api: MemorixBaseApi) -> None:
        super().__init__(api=api)

        self.bestStr = MemorixCacheItemNoKey[str](
            api=api,
            id="bestStr",
            payload_class=str,
        )
        self.allUsers = MemorixCacheItemNoKey[
            typing.List[typing.List[typing.Optional["User"]]]
        ](
            api=api,
            id="allUsers",
            payload_class=typing.List[typing.List[typing.Optional[User]]],
        )
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
        self.user2 = MemorixCacheItem["CacheUser2Key", "User"](
            api=api,
            id="user2",
            payload_class=User,
        )
        self.userExpire = MemorixCacheItem[str, "User"](
            api=api,
            id="userExpire",
            payload_class=User,
            options=MemorixCacheItem.Options(
                expire=MemorixCacheItem.Options.Expire(
                    value=1000,
                    is_in_ms=True,
                ),
            ),
        )
        self.userExpire2 = MemorixCacheItem[str, "User"](
            api=api,
            id="userExpire2",
            payload_class=User,
            options=MemorixCacheItem.Options(
                expire=None,
            ),
        )
        self.userExpire3 = MemorixCacheItemNoKey["User"](
            api=api,
            id="userExpire3",
            payload_class=User,
            options=MemorixCacheItem.Options(
                expire=MemorixCacheItem.Options.Expire(
                    value=2,
                    extend_on_get=True,
                ),
            ),
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
        self.runAlgoNewest = MemorixTaskItemNoKey[str, "Animal"](
            api=api,
            id="runAlgoNewest",
            payload_class=str,
            returns_class=Animal,
            options=MemorixTaskItem.Options(
                take_newest=True,
            ),
        )


class MemorixApi(
    MemorixBaseApi.with_global_data(  # type: ignore
        data=MemorixBaseApi.BaseApiWithGlobalData(
            default_options=MemorixBaseApi.BaseApiWithGlobalData.DefaultOptions(
                cache=MemorixCacheItem.Options(
                    expire=MemorixCacheItem.Options.Expire(
                        value=2,
                    ),
                ),
            ),
        ),
    )
):
    def __init__(
        self,
        redis_url: str,
    ) -> None:
        super().__init__(redis_url=redis_url)

        self.spaceship = MemorixSpaceshipNamespace(self)

        self.cache = MemorixCacheApi(self)
        self.pubsub = MemorixPubSubApi(self)
        self.task = MemorixTaskApi(self)
