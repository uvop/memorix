from typing import Any

from memorix_client_redis.features.api.json import to_json


def hash_key(id: str, key: Any) -> str:
    if key is None:
        return to_json(value=[id])
    return to_json(value=[id, key], sort_dict=True)
