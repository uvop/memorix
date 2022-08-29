from .memorix_client_api import MemorixClientApi

def start() -> None:
    memorix_client_api = MemorixClientApi()
    MemorixClientApi.say_hello()
