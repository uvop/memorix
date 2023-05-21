from ..namespace import Namespace


class CacheApi(object):
    def __init__(self, api: Namespace) -> None:
        self._api = api
