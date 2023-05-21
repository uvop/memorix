import typing
import asyncio
import functools
from .namespace import Namespace
from .redis_connection import RedisConnection

_DefaultOptions = Namespace.DefaultOptions


class _BaseApiWithGlobalData(object):
    DefaultOptions = _DefaultOptions

    def __init__(
        self,
        default_options: _DefaultOptions,  # type: ignore
    ) -> None:
        self.default_options = default_options


class BaseApi(Namespace):
    BaseApiWithGlobalData = _BaseApiWithGlobalData

    def __init__(
        self,
        redis_url: str,
        default_options: typing.Optional[_DefaultOptions] = None,  # type: ignore
    ) -> None:
        super().__init__(
            name=None,
            connection=RedisConnection(redis_url=redis_url),
            default_options=default_options,
        )

    @staticmethod
    def with_global_data(data: _BaseApiWithGlobalData) -> typing.Type["BaseApi"]:
        class ApiWithData(BaseApi):
            def __init__(
                self,
                redis_url: str,
            ) -> None:
                super().__init__(
                    redis_url=redis_url,
                    default_options=data.default_options,
                )

        return ApiWithData

    def connect(self) -> None:
        self._connection.redis.ping()
        self._connection.pubsub.ping()

    async def async_connect(self) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                BaseApi.connect,
                self=self,
            ),
        )
