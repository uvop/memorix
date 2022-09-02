from ..api import Api


class PubSubApi(object):
    def __init__(self, api: Api) -> None:
        self._api = api
