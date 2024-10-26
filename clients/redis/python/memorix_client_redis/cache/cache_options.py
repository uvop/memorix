import typing


class CacheOptions(object):
    def __init__(
        self,
        ttl: typing.Optional[str] = None,
        extend_on_get: typing.Optional[str] = None,
    ) -> None:
        self.ttl = ttl
        self.extend_on_get = extend_on_get
