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


class All(object):
    Base: typing_extensions.TypeAlias = TaskBase
    Options: typing_extensions.TypeAlias = TaskOptions

    ItemTTTT: typing_extensions.TypeAlias = TaskItemTTTT
    ItemTTTF: typing_extensions.TypeAlias = TaskItemTTTF
    ItemTTFT: typing_extensions.TypeAlias = TaskItemTTFT
    ItemTTFF: typing_extensions.TypeAlias = TaskItemTTFF
    ItemTFTT: typing_extensions.TypeAlias = TaskItemTFTT
    ItemTFTF: typing_extensions.TypeAlias = TaskItemTFTF
    ItemTFFT: typing_extensions.TypeAlias = TaskItemTFFT
    ItemTFFF: typing_extensions.TypeAlias = TaskItemTFFF
    ItemFTTT: typing_extensions.TypeAlias = TaskItemFTTT
    ItemFTTF: typing_extensions.TypeAlias = TaskItemFTTF
    ItemFTFT: typing_extensions.TypeAlias = TaskItemFTFT
    ItemFTFF: typing_extensions.TypeAlias = TaskItemFTFF
    ItemFFTT: typing_extensions.TypeAlias = TaskItemFFTT
    ItemFFTF: typing_extensions.TypeAlias = TaskItemFFTF
    ItemFFFT: typing_extensions.TypeAlias = TaskItemFFFT
    ItemFFFF: typing_extensions.TypeAlias = TaskItemFFFF
    ItemTTTTNoKey: typing_extensions.TypeAlias = TaskItemTTTTNoKey
    ItemTTTFNoKey: typing_extensions.TypeAlias = TaskItemTTTFNoKey
    ItemTTFTNoKey: typing_extensions.TypeAlias = TaskItemTTFTNoKey
    ItemTTFFNoKey: typing_extensions.TypeAlias = TaskItemTTFFNoKey
    ItemTFTTNoKey: typing_extensions.TypeAlias = TaskItemTFTTNoKey
    ItemTFTFNoKey: typing_extensions.TypeAlias = TaskItemTFTFNoKey
    ItemTFFTNoKey: typing_extensions.TypeAlias = TaskItemTFFTNoKey
    ItemTFFFNoKey: typing_extensions.TypeAlias = TaskItemTFFFNoKey
    ItemFTTTNoKey: typing_extensions.TypeAlias = TaskItemFTTTNoKey
    ItemFTTFNoKey: typing_extensions.TypeAlias = TaskItemFTTFNoKey
    ItemFTFTNoKey: typing_extensions.TypeAlias = TaskItemFTFTNoKey
    ItemFTFFNoKey: typing_extensions.TypeAlias = TaskItemFTFFNoKey
    ItemFFTTNoKey: typing_extensions.TypeAlias = TaskItemFFTTNoKey
    ItemFFTFNoKey: typing_extensions.TypeAlias = TaskItemFFTFNoKey
    ItemFFFTNoKey: typing_extensions.TypeAlias = TaskItemFFFTNoKey
    ItemFFFFNoKey: typing_extensions.TypeAlias = TaskItemFFFFNoKey
