from typing import Any, Type, TypeVar, cast
from dacite import from_dict, Config
from enum import Enum
import json
from dataclasses import asdict, is_dataclass

encoding = "utf-8"

TT = TypeVar("TT")


def to_json(value: TT) -> str:
    if is_dataclass(value):
        dict = asdict(value)
        return json.dumps(dict)
    if isinstance(value, Enum):
        return value.value
    return str(value)


def from_json(value: bytes, data_class: Type[TT]) -> TT:
    value_str = value.decode(encoding)
    if is_dataclass(data_class):
        dict = json.loads(value_str)

        return from_dict(
            data_class=data_class,
            data=dict,
            config=Config(cast=[Enum]),
        )
    if issubclass(data_class, Enum):
        return data_class(value_str)

    return value_str
