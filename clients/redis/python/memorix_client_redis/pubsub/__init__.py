import typing_extensions 
from .pubsub_base import PubSubBase
from .pubsub_item import (
    PubSubItemTT,
    PubSubItemTF,
    PubSubItemFT,
    PubSubItemFF,
    PubSubItemNoKeyTT,
    PubSubItemNoKeyTF,
    PubSubItemNoKeyFT,
    PubSubItemNoKeyFF,
)


class All(object):
    Base: typing_extensions.TypeAlias = PubSubBase
    ItemTT: typing_extensions.TypeAlias = PubSubItemTT
    ItemTF: typing_extensions.TypeAlias = PubSubItemTF
    ItemFT: typing_extensions.TypeAlias = PubSubItemFT
    ItemFF: typing_extensions.TypeAlias = PubSubItemFF
    ItemNoKeyTT: typing_extensions.TypeAlias = PubSubItemNoKeyTT
    ItemNoKeyTF: typing_extensions.TypeAlias = PubSubItemNoKeyTF
    ItemNoKeyFT: typing_extensions.TypeAlias = PubSubItemNoKeyFT
    ItemNoKeyFF: typing_extensions.TypeAlias = PubSubItemNoKeyFF
