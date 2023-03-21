import typing


class CacheSetOptionsExpire(object):
    def __init__(
        self,
        value: int,
        is_in_ms: typing.Optional[bool] = False,
    ) -> None:
        self.value = value
        self.is_in_ms = is_in_ms

    @staticmethod
    def merge(
        item1: typing.Optional["CacheSetOptionsExpire"],
        item2: typing.Optional["CacheSetOptionsExpire"],
    ) -> typing.Optional["CacheSetOptionsExpire"]:
        return item2


class CacheSetOptions(object):
    Expire = CacheSetOptionsExpire

    def __init__(
        self,
        expire: typing.Optional[CacheSetOptionsExpire] = None,
        extend_expire_on_get: typing.Optional[bool] = None,
    ) -> None:
        self.expire = expire
        self.extend_expire_on_get = extend_expire_on_get

    @staticmethod
    def merge(
        item1: typing.Optional["CacheSetOptions"],
        item2: typing.Optional["CacheSetOptions"],
    ) -> typing.Optional["CacheSetOptions"]:
        if item1 is None:
            return item2
        if item2 is None:
            return item1
        return CacheSetOptions(
            expire=CacheSetOptions.Expire.merge(item1.expire, item2.expire),
            extend_expire_on_get=item1.extend_expire_on_get
            if item2.extend_expire_on_get is None
            else item2.extend_expire_on_get,
        )
