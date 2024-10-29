import typing
from memorix_client_redis.json import to_json
from memorix_client_redis.memorix_base import MemorixBase


def hash_key(api: MemorixBase, id: str, has_key: bool, key: typing.Any) -> str:
    if has_key is False:
        return to_json(value=[*api._namespace_name_tree, id])
    return to_json(
        value=[*api._namespace_name_tree, id, key],
        sort_dict=True,
    )


def hash_key_better(api: MemorixBase, id: str, has_key: bool, key: typing.Any) -> str:
    if has_key:
        return to_json(
            value=[*api._namespace_name_tree, id, key],
            sort_dict=True,
        )
    return to_json(value=[*api._namespace_name_tree, id])
