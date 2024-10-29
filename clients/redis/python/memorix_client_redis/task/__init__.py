import typing
import typing_extensions
from .task_base import TaskBase
from .task_options import TaskOptions
from .task_item import (
    TaskItemTTTT,
    TaskItemTTTF,
    TaskItemTTFT,
    TaskItemTTFF,
    TaskItemTFTT,
    TaskItemTFTF,
    TaskItemTFFT,
    TaskItemTFFF,
    TaskItemFTTT,
    TaskItemFTTF,
    TaskItemFTFT,
    TaskItemFTFF,
    TaskItemFFTT,
    TaskItemFFTF,
    TaskItemFFFT,
    TaskItemFFFF,
    TaskItemTTTTNoKey,
    TaskItemTTTFNoKey,
    TaskItemTTFTNoKey,
    TaskItemTTFFNoKey,
    TaskItemTFTTNoKey,
    TaskItemTFTFNoKey,
    TaskItemTFFTNoKey,
    TaskItemTFFFNoKey,
    TaskItemFTTTNoKey,
    TaskItemFTTFNoKey,
    TaskItemFTFTNoKey,
    TaskItemFTFFNoKey,
    TaskItemFFTTNoKey,
    TaskItemFFTFNoKey,
    TaskItemFFFTNoKey,
    TaskItemFFFFNoKey,
)

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")


class All(object):
    Base: typing_extensions.TypeAlias = TaskBase
    Options: typing_extensions.TypeAlias = TaskOptions

    ItemTTTT: typing_extensions.TypeAlias = TaskItemTTTT[KT, PT]
    ItemTTTF: typing_extensions.TypeAlias = TaskItemTTTF[KT, PT]
    ItemTTFT: typing_extensions.TypeAlias = TaskItemTTFT[KT, PT]
    ItemTTFF: typing_extensions.TypeAlias = TaskItemTTFF[KT, PT]
    ItemTFTT: typing_extensions.TypeAlias = TaskItemTFTT[KT, PT]
    ItemTFTF: typing_extensions.TypeAlias = TaskItemTFTF[KT, PT]
    ItemTFFT: typing_extensions.TypeAlias = TaskItemTFFT[KT, PT]
    ItemTFFF: typing_extensions.TypeAlias = TaskItemTFFF[KT, PT]
    ItemFTTT: typing_extensions.TypeAlias = TaskItemFTTT[KT, PT]
    ItemFTTF: typing_extensions.TypeAlias = TaskItemFTTF[KT, PT]
    ItemFTFT: typing_extensions.TypeAlias = TaskItemFTFT[KT, PT]
    ItemFTFF: typing_extensions.TypeAlias = TaskItemFTFF[KT, PT]
    ItemFFTT: typing_extensions.TypeAlias = TaskItemFFTT[KT, PT]
    ItemFFTF: typing_extensions.TypeAlias = TaskItemFFTF[KT, PT]
    ItemFFFT: typing_extensions.TypeAlias = TaskItemFFFT[KT, PT]
    ItemFFFF: typing_extensions.TypeAlias = TaskItemFFFF[KT, PT]
    ItemTTTTNoKey: typing_extensions.TypeAlias = TaskItemTTTTNoKey[PT]
    ItemTTTFNoKey: typing_extensions.TypeAlias = TaskItemTTTFNoKey[PT]
    ItemTTFTNoKey: typing_extensions.TypeAlias = TaskItemTTFTNoKey[PT]
    ItemTTFFNoKey: typing_extensions.TypeAlias = TaskItemTTFFNoKey[PT]
    ItemTFTTNoKey: typing_extensions.TypeAlias = TaskItemTFTTNoKey[PT]
    ItemTFTFNoKey: typing_extensions.TypeAlias = TaskItemTFTFNoKey[PT]
    ItemTFFTNoKey: typing_extensions.TypeAlias = TaskItemTFFTNoKey[PT]
    ItemTFFFNoKey: typing_extensions.TypeAlias = TaskItemTFFFNoKey[PT]
    ItemFTTTNoKey: typing_extensions.TypeAlias = TaskItemFTTTNoKey[PT]
    ItemFTTFNoKey: typing_extensions.TypeAlias = TaskItemFTTFNoKey[PT]
    ItemFTFTNoKey: typing_extensions.TypeAlias = TaskItemFTFTNoKey[PT]
    ItemFTFFNoKey: typing_extensions.TypeAlias = TaskItemFTFFNoKey[PT]
    ItemFFTTNoKey: typing_extensions.TypeAlias = TaskItemFFTTNoKey[PT]
    ItemFFTFNoKey: typing_extensions.TypeAlias = TaskItemFFTFNoKey[PT]
    ItemFFFTNoKey: typing_extensions.TypeAlias = TaskItemFFFTNoKey[PT]
    ItemFFFFNoKey: typing_extensions.TypeAlias = TaskItemFFFFNoKey[PT]
