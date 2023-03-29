import typing


class CacheOptionsExpire(object):
    def __init__(
        self,
        value: int,
        is_in_ms: typing.Optional[bool] = False,
        extend_on_get: typing.Optional[bool] = False,
    ) -> None:
        self.value = value
        self.is_in_ms = is_in_ms
        self.extend_on_get = extend_on_get

    @staticmethod
    def merge(
        item1: typing.Optional["CacheOptionsExpire"],
        item2: typing.Optional["CacheOptionsExpire"],
    ) -> typing.Optional["CacheOptionsExpire"]:
        return item2


class CacheOptions(object):
    Expire = CacheOptionsExpire

    def __init__(
        self,
        expire: typing.Optional[CacheOptionsExpire] = None,
    ) -> None:
        self.expire = expire

    @staticmethod
    def merge(
        item1: typing.Optional["CacheOptions"],
        item2: typing.Optional["CacheOptions"],
    ) -> typing.Optional["CacheOptions"]:
        if item1 is None:
            return item2
        if item2 is None:
            return item1
        return CacheOptions(
            expire=CacheOptions.Expire.merge(item1.expire, item2.expire),
        )
