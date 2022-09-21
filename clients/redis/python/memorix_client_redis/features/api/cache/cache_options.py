from typing import Optional


class CacheSetOptionsExpire(object):
    def __init__(
        self,
        value: int,
        is_in_ms: Optional[bool] = False,
    ) -> None:
        self.value = value
        self.is_in_ms = is_in_ms


class CacheSetOptions(object):
    def __init__(
        self,
        expire: Optional[CacheSetOptionsExpire] = None,
    ) -> None:
        self.expire = expire
