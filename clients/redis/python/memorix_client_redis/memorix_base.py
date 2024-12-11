import typing
import asyncio
import functools
from .redis_connection import RedisConnection
from .value import Value


class MemorixBase(object):
    def __init__(
        self,
        redis_url: typing.Optional[Value] = None,
        ref: typing.Optional["MemorixBase"] = None,
    ) -> None:
        if ref is None and redis_url is not None:
            self._connection = RedisConnection(redis_url=redis_url.require())
        elif ref is not None:
            self._connection = ref._connection
        else:
            raise Exception("Didn't get redis_url or ref")

        self._namespace_name_tree = typing.cast(typing.List[str], [])

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
