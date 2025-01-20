import typing
from dacite import from_dict as dacite_from_dict, Config
from enum import Enum
import json
from dataclasses import asdict, dataclass

encoding = "utf-8"

TT = typing.TypeVar("TT")


def bytes_to_str(value: bytes) -> str:
    return value.decode(encoding)


def _order_dict(value: TT) -> TT:
    if isinstance(value, list):
        return typing.cast(TT, [_order_dict(item) for item in value])
    if isinstance(value, dict):
        result = {}
        for item_key, item_value in sorted(value.items()):
            if isinstance(value, typing.Dict):
                result[item_key] = _order_dict(item_value)
            else:
                result[item_key] = item_value
        return typing.cast(TT, result)
    return value


def to_json(value: TT, sort_dict: bool = False) -> str:
    if value is None:
        return "null"

    @dataclass
    class JSON(object):
        value: TT

    json_obj = JSON(value=value)
    dict = asdict(
        json_obj,
        dict_factory=lambda dict: {
            d_key: d_value for (d_key, d_value) in dict if d_value is not None
        },
    )
    if sort_dict:
        dict = _order_dict(dict)
    return json.dumps(dict["value"], separators=(",", ":"))


def from_json(value: str, data_class: typing.Any) -> typing.Any:
    data_class_any: typing.Any = data_class

    @dataclass
    class JSON(object):
        value: data_class_any

    value_to_json = '{{"value":{0}}}'.format(value)
    dict = json.loads(value_to_json)
    json_obj = dacite_from_dict(
        data=dict,
        data_class=JSON,
        config=Config(cast=[Enum]),
    )

    return typing.cast(typing.Any, json_obj).value
