from ..namespace import Namespace


class PubSubApi(object):
    def __init__(self, api: Namespace) -> None:
        self._api = api
