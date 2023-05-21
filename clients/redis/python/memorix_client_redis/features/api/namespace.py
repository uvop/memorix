from redis import Redis
import typing
from .default_options import DefaultOptions

_DefaultOptions = DefaultOptions


class _NamespaceApiWithData(object):
    DefaultOptions = _DefaultOptions

    def __init__(
        self,
        name: typing.Optional[str],
        default_options: _DefaultOptions,
    ) -> None:
        self.name = name
        self.default_options = default_options


class NamespaceApi(object):
    def __init__(
        self,
        redis_url: str,
    ) -> None:
        self.redis = Redis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()


class Namespace(object):
    DefaultOptions = _DefaultOptions
    NamespaceApiWithData = _NamespaceApiWithData

    def __init__(
        self,
        namespace_api: NamespaceApi,
        default_options: typing.Optional[_DefaultOptions] = None,
    ) -> None:
        self._namespace_api = namespace_api
        self._default_options = default_options

    @staticmethod
    def with_data(data: _NamespaceApiWithData) -> typing.Type["Namespace"]:
        class NamespaceWithData(Namespace):
            def __init__(
                self,
                namespace_api: NamespaceApi,
                default_options: typing.Optional[_DefaultOptions] = None,
            ) -> None:
                super().__init__(
                    namespace_api=namespace_api,
                    default_options=data.default_options,
                )

        return NamespaceWithData
