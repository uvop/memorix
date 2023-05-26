import typing
from .cache.cache_options import CacheOptions as _CacheOptions
from .task.task_options import TaskDequequeOptions as _TaskDequequeOptions


class DefaultOptions(object):
    Cache = _CacheOptions
    Task = _TaskDequequeOptions

    def __init__(
        self,
        cache: typing.Optional[_CacheOptions] = None,
        task: typing.Optional[_TaskDequequeOptions] = None,
    ) -> None:
        self.cache = cache
        self.task = task
