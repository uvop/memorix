from typing import Any, Dict, Type, TypeVar, cast
from dacite import from_dict as dacite_from_dict, Config
from enum import Enum
import json
from dataclasses import asdict, is_dataclass

encoding = "utf-8"

TT = TypeVar("TT")


def order_dict(dict: Dict[str, Any]) -> Dict[str, Any]:
    result = {}
    for key, value in sorted(dict.items()):
        if isinstance(value, Dict):
            result[key] = order_dict(value)
        else:
            result[key] = value
    return result


def to_json(value: TT, sort_dict: bool = False) -> str:
    if is_dataclass(value):
        dict = asdict(value)
        if sort_dict:
            dict = order_dict(dict)
        return json.dumps(dict)
    if isinstance(value, Enum):
        return cast(str, value.value)
    return json.dumps(value)


def from_json(value: bytes, data_class: Type[TT]) -> TT:
    value_str = value.decode(encoding)
    if is_dataclass(data_class):
        dict = json.loads(value_str)

        return from_dict(
            dict=dict,
            data_class=data_class,
        )
    if issubclass(data_class, Enum):
        return cast(TT, data_class(value_str))

    return cast(TT, value_str)


def from_json_to_dict(value: bytes) -> Dict[str, Any]:
    value_str = value.decode(encoding)
    dict = json.loads(value_str)
    return cast(Dict[str, Any], dict)


def from_dict(dict: Dict[str, Any], data_class: Type[TT]) -> TT:
    if is_dataclass(data_class):
        return dacite_from_dict(
            data=dict,
            data_class=data_class,
            config=Config(cast=[Enum]),
        )
    if issubclass(data_class, Enum):
        return cast(TT, data_class(dict))

    return cast(TT, dict)
