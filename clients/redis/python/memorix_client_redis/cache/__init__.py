import typing
import typing_extensions
from .cache_base import CacheBase
from .cache_options import CacheOptions
from .cache_item import (
    CacheItemTTT,
    CacheItemTTF,
    CacheItemTFT,
    CacheItemTFF,
    CacheItemFTT,
    CacheItemFTF,
    CacheItemFFT,
    CacheItemFFF,
    CacheItemTTTNoKey,
    CacheItemTTFNoKey,
    CacheItemTFTNoKey,
    CacheItemTFFNoKey,
    CacheItemFTTNoKey,
    CacheItemFTFNoKey,
    CacheItemFFTNoKey,
    CacheItemFFFNoKey,
)

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")


class All(object):
    Base: typing_extensions.TypeAlias = CacheBase
    Options: typing_extensions.TypeAlias = CacheOptions
    ItemTTT: typing_extensions.TypeAlias = CacheItemTTT[KT, PT]
    ItemTTF: typing_extensions.TypeAlias = CacheItemTTF[KT, PT]
    ItemTFT: typing_extensions.TypeAlias = CacheItemTFT[KT, PT]
    ItemTFF: typing_extensions.TypeAlias = CacheItemTFF[KT, PT]
    ItemFTT: typing_extensions.TypeAlias = CacheItemFTT[KT, PT]
    ItemFTF: typing_extensions.TypeAlias = CacheItemFTF[KT, PT]
    ItemFFT: typing_extensions.TypeAlias = CacheItemFFT[KT, PT]
    ItemFFF: typing_extensions.TypeAlias = CacheItemFFF[KT, PT]
    ItemTTTNoKey: typing_extensions.TypeAlias = CacheItemTTTNoKey[PT]
    ItemTTFNoKey: typing_extensions.TypeAlias = CacheItemTTFNoKey[PT]
    ItemTFTNoKey: typing_extensions.TypeAlias = CacheItemTFTNoKey[PT]
    ItemTFFNoKey: typing_extensions.TypeAlias = CacheItemTFFNoKey[PT]
    ItemFTTNoKey: typing_extensions.TypeAlias = CacheItemFTTNoKey[PT]
    ItemFTFNoKey: typing_extensions.TypeAlias = CacheItemFTFNoKey[PT]
    ItemFFTNoKey: typing_extensions.TypeAlias = CacheItemFFTNoKey[PT]
    ItemFFFNoKey: typing_extensions.TypeAlias = CacheItemFFFNoKey[PT]
