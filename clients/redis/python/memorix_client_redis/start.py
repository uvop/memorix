from .memorix_client_api import MemorixClientApi


def start() -> None:
    MemorixClientApi().say_hello()
