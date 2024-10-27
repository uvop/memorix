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


class All(object):
    Base: typing_extensions.TypeAlias = CacheBase
    Options: typing_extensions.TypeAlias = CacheOptions
    ItemTTT: typing_extensions.TypeAlias = CacheItemTTT
    ItemTTF: typing_extensions.TypeAlias = CacheItemTTF
    ItemTFT: typing_extensions.TypeAlias = CacheItemTFT
    ItemTFF: typing_extensions.TypeAlias = CacheItemTFF
    ItemFTT: typing_extensions.TypeAlias = CacheItemFTT
    ItemFTF: typing_extensions.TypeAlias = CacheItemFTF
    ItemFFT: typing_extensions.TypeAlias = CacheItemFFT
    ItemFFF: typing_extensions.TypeAlias = CacheItemFFF
    ItemTTTNoKey: typing_extensions.TypeAlias = CacheItemTTTNoKey
    ItemTTFNoKey: typing_extensions.TypeAlias = CacheItemTTFNoKey
    ItemTFTNoKey: typing_extensions.TypeAlias = CacheItemTFTNoKey
    ItemTFFNoKey: typing_extensions.TypeAlias = CacheItemTFFNoKey
    ItemFTTNoKey: typing_extensions.TypeAlias = CacheItemFTTNoKey
    ItemFTFNoKey: typing_extensions.TypeAlias = CacheItemFTFNoKey
    ItemFFTNoKey: typing_extensions.TypeAlias = CacheItemFFTNoKey
    ItemFFFNoKey: typing_extensions.TypeAlias = CacheItemFFFNoKey
