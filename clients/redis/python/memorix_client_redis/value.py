import typing
import os
from enum import Enum


class ValueType(str, Enum):
    string = "string"
    env_variable = "env_variable"


class ValueString(object):
    def __init__(
        self,
        value: str,
    ) -> None:
        self._value = value


class ValueEnvVariable(object):
    def __init__(
        self,
        name: str,
        value: typing.Optional[str],
    ) -> None:
        self._name = name
        self._value = value


class Value(object):
    def __init__(
        self,
        type: ValueType,
        string: typing.Optional[ValueString],
        env_variable: typing.Optional[ValueEnvVariable],
    ) -> None:
        self._type = type
        self._string = string
        self._env_variable = env_variable

    def require(self) -> str:
        if self._type == ValueType.string:
            return typing.cast(ValueString, self._string)._value
        env_variable = typing.cast(ValueEnvVariable, self._env_variable)
        if env_variable._value is None:
            raise Exception(
                "Environment variable {env_variable_name} is not set".format(
                    env_variable_name=env_variable._name,
                ),
            )

        return env_variable._value

    @classmethod
    def from_string(cls, value: str) -> "Value":
        return cls(
            type=ValueType.string,
            string=ValueString(value=value),
            env_variable=None,
        )

    @classmethod
    def from_env_variable(cls, name: str) -> "Value":
        value = os.environ.get(name)
        return cls(
            type=ValueType.env_variable,
            env_variable=ValueEnvVariable(name=name, value=value),
            string=None,
        )
