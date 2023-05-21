import typing

from memorix_client_redis.features.api.json import to_json


def hash_key(namespace: typing.Optional[str], id: str, key: typing.Any) -> str:
    if key is None:
        if namespace is None:
            return to_json(value=[id])
        return to_json(value=[namespace, id])

    if namespace is None:
        return to_json(
            value=[id, key],
            sort_dict=True,
        )
    return to_json(
        value=[namespace, id, key],
        sort_dict=True,
    )
