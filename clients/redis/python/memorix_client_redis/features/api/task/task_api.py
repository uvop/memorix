from ..api import Api


class TaskApi(object):
    def __init__(self, api: Api) -> None:
        self._api = api
