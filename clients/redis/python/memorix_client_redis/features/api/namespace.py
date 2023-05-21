import typing
from .default_options import DefaultOptions
from .redis_connection import RedisConnection

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


class Namespace(object):
    DefaultOptions = _DefaultOptions
    NamespaceApiWithData = _NamespaceApiWithData

    def __init__(
        self,
        connection: RedisConnection,
        name: typing.Optional[str],
        default_options: typing.Optional[_DefaultOptions] = None,
    ) -> None:
        self._name = name
        self._connection = connection
        self._default_options = default_options

    @staticmethod
    def with_data(data: _NamespaceApiWithData) -> typing.Type["Namespace"]:
        class NamespaceWithData(Namespace):
            def __init__(
                self,
                connection: RedisConnection,
            ) -> None:
                super().__init__(
                    name=data.name,
                    connection=connection,
                    default_options=data.default_options,
                )

        return NamespaceWithData
