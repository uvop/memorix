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


class All(object):
    Base: typing_extensions.TypeAlias = PubSubBase
    ItemTT: typing_extensions.TypeAlias = PubSubItemTT
    ItemTF: typing_extensions.TypeAlias = PubSubItemTF
    ItemFT: typing_extensions.TypeAlias = PubSubItemFT
    ItemFF: typing_extensions.TypeAlias = PubSubItemFF
    ItemTTNoKey: typing_extensions.TypeAlias = PubSubItemTTNoKey
    ItemTFNoKey: typing_extensions.TypeAlias = PubSubItemTFNoKey
    ItemFTNoKey: typing_extensions.TypeAlias = PubSubItemFTNoKey
    ItemFFNoKey: typing_extensions.TypeAlias = PubSubItemFFNoKey
