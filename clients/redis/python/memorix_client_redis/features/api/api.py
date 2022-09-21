from redis import Redis
from typing import Optional
from .cache.cache_options import CacheSetOptions
from .task.task_options import TaskDequequeOptions


class ApiDefaults(object):
    def __init__(
        self,
        cache_set_options: Optional[CacheSetOptions] = None,
        task_dequeque_options: Optional[TaskDequequeOptions] = None,
    ) -> None:
        self.cache_set_options = cache_set_options
        self.task_dequeque_options = task_dequeque_options


class Api(object):
    def __init__(self, redis_url: str, defaults: Optional[ApiDefaults] = None) -> None:
        self._redis = Redis.from_url(redis_url)
        self._pubsub = self._redis.pubsub()
        self._defaults = defaults
