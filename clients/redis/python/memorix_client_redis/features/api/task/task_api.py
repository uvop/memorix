from ..base_api import BaseApi


class TaskApi(object):
    def __init__(self, api: BaseApi) -> None:
        self._api = api
