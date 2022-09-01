import typing
from enum import Enum
from . import (
    dataclass,
    MemorixClientApi,
    MemorixClientCacheApi,
    MemorixClientCacheApiItem,
    MemorixClientPubsubApi,
    MemorixClientPubsubApiItem,
    MemorixClientTaskApi,
    MemorixClientTaskApiItem,
)


class Animal(Enum):
    dog = "dog"
    cat = "cat"
    person = "person"


@dataclass
class User:
    name: str
    age: typing.Optional[int]


class MemorixCacheApi(MemorixClientCacheApi):
    def __init__(self, *args, **kwargs):
        super(MemorixCacheApi, self).__init__(*args, **kwargs)

        favoriteAnimal = MemorixClientCacheApiItem(str, Animal, *args, **kwargs)
        user = MemorixClientCacheApiItem(str, User, *args, **kwargs)


class MemorixPubsubApi(MemorixClientPubsubApi):
    def __init__(self, *args, **kwargs):
        super(MemorixPubsubApi, self).__init__(*args, **kwargs)

        message = MemorixClientPubsubApiItem(None, str, *args, **kwargs)


class MemorixTaskApi(MemorixClientTaskApi):
    def __init__(self, *args, **kwargs):
        super(MemorixTaskApi, self).__init__(*args, **kwargs)

        runAlgo = MemorixClientTaskApiItem(None, str, Animals, *args, **kwargs)


class MemorixApi(MemorixClientApi):
    def __init__(self, *args, **kwargs):
        super(MemorixApi, self).__init__(*args, **kwargs)

        cache = MemorixCacheApi(*args, **kwargs)
        pubsub = MemorixPubsubApi(*args, **kwargs)
        task = MemorixTaskApi(*args, **kwargs)
