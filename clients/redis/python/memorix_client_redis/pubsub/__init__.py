import typing
import typing_extensions
from .pubsub_base import PubSubBase
from .pubsub_item import (
    PubSubItemTT,
    PubSubItemTF,
    PubSubItemFT,
    PubSubItemFF,
    PubSubItemTTNoKey,
    PubSubItemTFNoKey,
    PubSubItemFTNoKey,
    PubSubItemFFNoKey,
)

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")


class All(object):
    Base: typing_extensions.TypeAlias = PubSubBase
    ItemTT: typing_extensions.TypeAlias = PubSubItemTT[KT, PT]
    ItemTF: typing_extensions.TypeAlias = PubSubItemTF[KT, PT]
    ItemFT: typing_extensions.TypeAlias = PubSubItemFT[KT, PT]
    ItemFF: typing_extensions.TypeAlias = PubSubItemFF[KT, PT]
    ItemTTNoKey: typing_extensions.TypeAlias = PubSubItemTTNoKey[PT]
    ItemTFNoKey: typing_extensions.TypeAlias = PubSubItemTFNoKey[PT]
    ItemFTNoKey: typing_extensions.TypeAlias = PubSubItemFTNoKey[PT]
    ItemFFNoKey: typing_extensions.TypeAlias = PubSubItemFFNoKey[PT]
