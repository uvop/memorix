import typing
from ..value import Value


class CacheOptions(object):
    def __init__(
        self,
        ttl: typing.Optional[Value] = None,
        extend_on_get: typing.Optional[Value] = None,
    ) -> None:
        self.ttl = ttl
        self.extend_on_get = extend_on_get

    def get_ttl(self) -> int:
        if self.ttl is None:
            return 0
        return int(self.ttl.require())

    def get_extend_on_get(self) -> bool:
        if self.extend_on_get is None:
            return False
        return self.extend_on_get.require() == "true"
