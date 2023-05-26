from memorix_client_redis.memorix_base import MemorixBase


class TaskBase(object):
    def __init__(self, api: MemorixBase) -> None:
        self._api = api
