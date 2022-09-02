from ..api import Api


class CacheApi(object):
    def __init__(self, api: Api) -> None:
        self._api = api
