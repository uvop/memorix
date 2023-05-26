from ..memorix_base import MemorixBase


class CacheBase(object):
    def __init__(self, api: MemorixBase) -> None:
        self._api = api
