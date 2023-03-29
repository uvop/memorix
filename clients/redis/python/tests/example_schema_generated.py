# flake8: noqa
import typing

if typing.TYPE_CHECKING:
    from dataclasses import dataclass
else:
    from memorix_client_redis import dataclass

from enum import Enum
from memorix_client_redis import (
    MemorixClientApi,
    MemorixClientApiDefaults as _MemorixClientApiDefaults,
    MemorixClientCacheApi,
    MemorixClientCacheApiItem,
    MemorixClientCacheApiItemNoKey,
    MemorixClientCacheOptions as _MemorixClientCacheOptions,
    MemorixClientCacheOptionsExpire as _MemorixClientCacheOptionsExpire,
    MemorixClientPubSubApi,
    MemorixClientPubSubApiItem,
    MemorixClientPubSubApiItemNoKey,
    MemorixClientTaskApi,
    MemorixClientTaskApiItem,
    MemorixClientTaskApiItemNoKey,
    MemorixClientTaskApiItemNoReturns,
    MemorixClientTaskApiItemNoKeyNoReturns,
    MemorixClientTaskDequequeOptions as _MemorixClientTaskDequequeOptions,
)


MemorixClientApiDefaults = _MemorixClientApiDefaults
MemorixClientCacheOptions = _MemorixClientCacheOptions
MemorixClientCacheOptionsExpire = _MemorixClientCacheOptionsExpire
MemorixClientTaskDequequeOptions = _MemorixClientTaskDequequeOptions


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


class MemorixCacheApi(MemorixClientCacheApi):
    def __init__(self, api: MemorixClientApi) -> None:
        super().__init__(api=api)

        self.bestStr = MemorixClientCacheApiItemNoKey[str](
            api=self._api,
            id="bestStr",
            payload_class=str,
        )
        self.allUsers = MemorixClientCacheApiItemNoKey[
            typing.List[typing.List[typing.Optional["User"]]]
        ](
            api=self._api,
            id="allUsers",
            payload_class=typing.List[typing.List[typing.Optional[User]]],
        )
        self.favoriteAnimal = MemorixClientCacheApiItem[str, "Animal"](
            api=self._api,
            id="favoriteAnimal",
            payload_class=Animal,
        )
        self.user = MemorixClientCacheApiItem[str, "User"](
            api=self._api,
            id="user",
            payload_class=User,
        )
        self.user2 = MemorixClientCacheApiItem["CacheUser2Key", "User"](
            api=self._api,
            id="user2",
            payload_class=User,
        )
        self.userExpire = MemorixClientCacheApiItem[str, "User"](
            api=self._api,
            id="userExpire",
            payload_class=User,
            options=MemorixClientCacheOptions(
                expire=MemorixClientCacheOptionsExpire(
                    value=1000,
                    is_in_ms=True,
                ),
            ),
        )
        self.userExpire2 = MemorixClientCacheApiItem[str, "User"](
            api=self._api,
            id="userExpire2",
            payload_class=User,
            options=MemorixClientCacheOptions(
                expire=None,
            ),
        )
        self.userExpire3 = MemorixClientCacheApiItem[str, "User"](
            api=self._api,
            id="userExpire3",
            payload_class=User,
            options=MemorixClientCacheOptions(
                expire=MemorixClientCacheOptionsExpire(
                    value=2,
                    extend_on_get=True,
                ),
            ),
        )


class MemorixPubSubApi(MemorixClientPubSubApi):
    def __init__(self, api: MemorixClientApi) -> None:
        super().__init__(api=api)

        self.message = MemorixClientPubSubApiItemNoKey[str](
            api=self._api,
            id="message",
            payload_class=str,
        )


class MemorixTaskApi(MemorixClientTaskApi):
    def __init__(self, api: MemorixClientApi) -> None:
        super().__init__(api=api)

        self.runAlgo = MemorixClientTaskApiItemNoKey[str, "Animal"](
            api=self._api,
            id="runAlgo",
            payload_class=str,
            returns_class=Animal,
        )
        self.runAlgoNewest = MemorixClientTaskApiItemNoKey[str, "Animal"](
            api=self._api,
            id="runAlgoNewest",
            payload_class=str,
            returns_class=Animal,
            options=MemorixClientTaskDequequeOptions(
                take_newest=True,
            ),
        )


class MemorixApi(
    MemorixClientApi.from_config(  # type: ignore
        config=MemorixClientApi.Config(
            default_options=MemorixClientApi.Config.DefaultOptions(
                cache=MemorixClientCacheOptions(
                    expire=MemorixClientCacheOptionsExpire(
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
        defaults: typing.Optional[MemorixClientApiDefaults] = None,
    ) -> None:
        super().__init__(redis_url=redis_url, defaults=defaults)

        self.cache = MemorixCacheApi(self)
        self.pubsub = MemorixPubSubApi(self)
        self.task = MemorixTaskApi(self)
