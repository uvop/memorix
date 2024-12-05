import typing
import typing_extensions
from .cache_base import CacheBase
from .cache_options import CacheOptions
from .cache_item import (
    CacheItemTTTT,
    CacheItemTTFT,
    CacheItemTFTT,
    CacheItemTFFT,
    CacheItemFTTT,
    CacheItemFTFT,
    CacheItemFFTT,
    CacheItemFFFT,
    CacheItemTTTF,
    CacheItemTTFF,
    CacheItemTFTF,
    CacheItemTFFF,
    CacheItemFTTF,
    CacheItemFTFF,
    CacheItemFFTF,
    CacheItemFFFF,
    CacheItemTTTTNoKey,
    CacheItemTTFTNoKey,
    CacheItemTFTTNoKey,
    CacheItemTFFTNoKey,
    CacheItemFTTTNoKey,
    CacheItemFTFTNoKey,
    CacheItemFFTTNoKey,
    CacheItemFFFTNoKey,
    CacheItemTTTFNoKey,
    CacheItemTTFFNoKey,
    CacheItemTFTFNoKey,
    CacheItemTFFFNoKey,
    CacheItemFTTFNoKey,
    CacheItemFTFFNoKey,
    CacheItemFFTFNoKey,
    CacheItemFFFFNoKey,
)

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")


class All(object):
    Base: typing_extensions.TypeAlias = CacheBase
    Options: typing_extensions.TypeAlias = CacheOptions
    ItemTTTT: typing_extensions.TypeAlias = CacheItemTTTT[KT, PT]
    ItemTTFT: typing_extensions.TypeAlias = CacheItemTTFT[KT, PT]
    ItemTFTT: typing_extensions.TypeAlias = CacheItemTFTT[KT, PT]
    ItemTFFT: typing_extensions.TypeAlias = CacheItemTFFT[KT, PT]
    ItemFTTT: typing_extensions.TypeAlias = CacheItemFTTT[KT, PT]
    ItemFTFT: typing_extensions.TypeAlias = CacheItemFTFT[KT, PT]
    ItemFFTT: typing_extensions.TypeAlias = CacheItemFFTT[KT, PT]
    ItemFFFT: typing_extensions.TypeAlias = CacheItemFFFT[KT, PT]
    ItemTTTF: typing_extensions.TypeAlias = CacheItemTTTF[KT, PT]
    ItemTTFF: typing_extensions.TypeAlias = CacheItemTTFF[KT, PT]
    ItemTFTF: typing_extensions.TypeAlias = CacheItemTFTF[KT, PT]
    ItemTFFF: typing_extensions.TypeAlias = CacheItemTFFF[KT, PT]
    ItemFTTF: typing_extensions.TypeAlias = CacheItemFTTF[KT, PT]
    ItemFTFF: typing_extensions.TypeAlias = CacheItemFTFF[KT, PT]
    ItemFFTF: typing_extensions.TypeAlias = CacheItemFFTF[KT, PT]
    ItemFFFF: typing_extensions.TypeAlias = CacheItemFFFF[KT, PT]
    ItemTTTTNoKey: typing_extensions.TypeAlias = CacheItemTTTTNoKey[PT]
    ItemTTFTNoKey: typing_extensions.TypeAlias = CacheItemTTFTNoKey[PT]
    ItemTFTTNoKey: typing_extensions.TypeAlias = CacheItemTFTTNoKey[PT]
    ItemTFFTNoKey: typing_extensions.TypeAlias = CacheItemTFFTNoKey[PT]
    ItemFTTTNoKey: typing_extensions.TypeAlias = CacheItemFTTTNoKey[PT]
    ItemFTFTNoKey: typing_extensions.TypeAlias = CacheItemFTFTNoKey[PT]
    ItemFFTTNoKey: typing_extensions.TypeAlias = CacheItemFFTTNoKey[PT]
    ItemFFFTNoKey: typing_extensions.TypeAlias = CacheItemFFFTNoKey[PT]
    ItemTTTFNoKey: typing_extensions.TypeAlias = CacheItemTTTFNoKey[PT]
    ItemTTFFNoKey: typing_extensions.TypeAlias = CacheItemTTFFNoKey[PT]
    ItemTFTFNoKey: typing_extensions.TypeAlias = CacheItemTFTFNoKey[PT]
    ItemTFFFNoKey: typing_extensions.TypeAlias = CacheItemTFFFNoKey[PT]
    ItemFTTFNoKey: typing_extensions.TypeAlias = CacheItemFTTFNoKey[PT]
    ItemFTFFNoKey: typing_extensions.TypeAlias = CacheItemFTFFNoKey[PT]
    ItemFFTFNoKey: typing_extensions.TypeAlias = CacheItemFFTFNoKey[PT]
    ItemFFFFNoKey: typing_extensions.TypeAlias = CacheItemFFFFNoKey[PT]
