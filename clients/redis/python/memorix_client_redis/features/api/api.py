from redis import Redis
import typing
from .cache.cache_options import CacheSetOptions as _CacheSetOptions
from .task.task_options import TaskDequequeOptions as _TaskDequequeOptions
import asyncio
import functools


class ApiDefaults(object):
    CacheSetOptions = _CacheSetOptions
    TaskDequequeOptions = _TaskDequequeOptions

    def __init__(
        self,
        cache_set_options: typing.Optional[_CacheSetOptions] = None,
        task_dequeque_options: typing.Optional[_TaskDequequeOptions] = None,
    ) -> None:
        self.cache_set_options = cache_set_options
        self.task_dequeque_options = task_dequeque_options

    @staticmethod
    def merge(
        item1: typing.Optional["ApiDefaults"],
        item2: typing.Optional["ApiDefaults"],
    ) -> typing.Optional["ApiDefaults"]:
        if item1 is None:
            return item2
        if item2 is None:
            return item1
        return ApiDefaults(
            cache_set_options=ApiDefaults.CacheSetOptions.merge(
                item1.cache_set_options,
                item2.cache_set_options,
            ),
            task_dequeque_options=ApiDefaults.TaskDequequeOptions.merge(
                item1.task_dequeque_options,
                item2.task_dequeque_options,
            ),
        )


class _ApiConfigDefaultOptions(object):
    def __init__(
        self,
        cache: typing.Optional[_CacheSetOptions] = None,
        task: typing.Optional[_TaskDequequeOptions] = None,
    ) -> None:
        self.cache = cache
        self.task = task


class _ApiConfig(object):
    DefaultOptions = _ApiConfigDefaultOptions

    def __init__(
        self,
        default_options: _ApiConfigDefaultOptions,
    ) -> None:
        self.default_options = default_options


class Api(object):
    Config = _ApiConfig

    def __init__(
        self,
        redis_url: str,
        defaults: typing.Optional[ApiDefaults] = None,
    ) -> None:
        self._redis = Redis.from_url(redis_url)
        self._pubsub = self._redis.pubsub()
        self._defaults = defaults

    @staticmethod
    def from_config(config: _ApiConfig) -> typing.Type["Api"]:
        class ApiWithConfig(Api):
            def __init__(
                self,
                redis_url: str,
                defaults: typing.Optional[ApiDefaults] = None,
            ) -> None:
                merged_defaults = ApiDefaults.merge(
                    ApiDefaults(
                        cache_set_options=config.default_options.cache,
                        task_dequeque_options=config.default_options.task,
                    ),
                    defaults,
                )

                super().__init__(redis_url=redis_url, defaults=merged_defaults)

        return ApiWithConfig

    def connect(self) -> None:
        self._redis.ping()
        self._pubsub.ping()

    async def async_connect(self) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                Api.connect,
                self=self,
            ),
        )
