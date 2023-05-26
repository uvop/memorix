import typing
from memorix_client_redis.json import to_json
from memorix_client_redis.memorix_base import MemorixBase


def hash_key(api: MemorixBase, id: str, key: typing.Any) -> str:
    if key is None:
        return to_json(value=[*api._namespace_name_tree, id])
    return to_json(
        value=[*api._namespace_name_tree, id, key],
        sort_dict=True,
    )
