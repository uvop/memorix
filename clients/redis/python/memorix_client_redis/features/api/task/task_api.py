from ..namespace import Namespace


class TaskApi(object):
    def __init__(self, api: Namespace) -> None:
        self._api = api
