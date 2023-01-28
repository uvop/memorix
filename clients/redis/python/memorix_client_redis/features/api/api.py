from redis import Redis
import typing
from .cache.cache_options import CacheSetOptions
from .task.task_options import TaskDequequeOptions


class ApiDefaults(object):
    def __init__(
        self,
        cache_set_options: typing.Optional[CacheSetOptions] = None,
        task_dequeque_options: typing.Optional[TaskDequequeOptions] = None,
    ) -> None:
        self.cache_set_options = cache_set_options
        self.task_dequeque_options = task_dequeque_options


class _ApiConfigDefaultOptions(object):
    def __init__(
        self,
        cache: typing.Optional[CacheSetOptions] = None,
        task: typing.Optional[TaskDequequeOptions] = None,
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
                super().__init__(redis_url=redis_url, defaults=defaults)

        return ApiWithConfig
