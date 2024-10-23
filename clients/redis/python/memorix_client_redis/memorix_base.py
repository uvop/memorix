import typing
import asyncio
import functools
from .default_options import DefaultOptions
from .redis_connection import RedisConnection

_DefaultOptions = DefaultOptions


class MemorixBase(object):
    DefaultOptions = _DefaultOptions

    def __init__(
        self,
        redis_url: typing.Optional[str] = None,
        ref: typing.Optional["MemorixBase"] = None,
    ) -> None:
        if ref is None:
            self._connection = RedisConnection(redis_url=redis_url)
        else:
            self._connection = ref._connection

        self._namespace_name_tree = typing.cast(typing.List[str], [])
        self._default_options = typing.cast(typing.Optional[_DefaultOptions], None)

    def connect(self) -> None:
        self._connection.redis.ping()
        self._connection.pubsub.ping()

    async def async_connect(self) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                MemorixBase.connect,
                self=self,
            ),
        )
