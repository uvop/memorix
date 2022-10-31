from typing import Any

from memorix_client_redis.features.api.json import (
    to_json,
    to_json_serializable,
    to_json_from_json_serializable,
)


def hash_key(id: str, key: Any) -> str:
    if key is None:
        return to_json(value=[id])
    key_serializeable = to_json_serializable(
        value=key,
        sort_dict=True,
    )
    json = to_json_from_json_serializable(value=[id, key_serializeable])
    return json
