from ..base_api import BaseApi


class CacheApi(object):
    def __init__(self, api: BaseApi) -> None:
        self._api = api
