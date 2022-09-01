from .task_api import TaskApi
from typing import Generic, TypeVar, cast

KT = TypeVar("KT")
PT = TypeVar("PT")
RT = TypeVar("RT")


class TaskItem(Generic[KT, PT, RT]):
    def __init__(
        self,
        task_api: TaskApi,
        id: str,
    ) -> None:
        self._task_api = task_api
        self._id = id

    def get(self, key: KT) -> PT:
        print("get sync")
        return cast(PT, None)

    async def async_get(self, key: KT) -> PT:
        print("get async")
        return cast(PT, None)

    def set(self, key: KT, payload: PT) -> None:
        print("set sync")

    async def async_set(self, key: KT, payload: PT) -> None:
        print("set async")


class TaskItemNoKey(Generic[PT, RT]):
    def __init__(
        self,
        task_api: TaskApi,
        id: str,
    ) -> None:
        self._task_api = task_api
        self._id = id

    def get(self) -> PT:
        print("get sync")
        return cast(PT, None)

    async def async_get(self) -> PT:
        print("get async")
        return cast(PT, None)

    def set(self, payload: PT) -> None:
        print("set sync")

    async def async_set(self, payload: PT) -> None:
        print("set async")


class TaskItemNoReturns(Generic[KT, PT]):
    def __init__(
        self,
        task_api: TaskApi,
        id: str,
    ) -> None:
        self._task_api = task_api
        self._id = id

    def get(self) -> PT:
        print("get sync")
        return cast(PT, None)

    async def async_get(self) -> PT:
        print("get async")
        return cast(PT, None)

    def set(self, payload: PT) -> None:
        print("set sync")

    async def async_set(self, payload: PT) -> None:
        print("set async")


class TaskItemNoKeyNoReturns(Generic[PT]):
    def __init__(
        self,
        task_api: TaskApi,
        id: str,
    ) -> None:
        self._task_api = task_api
        self._id = id

    def get(self) -> PT:
        print("get sync")
        return cast(PT, None)

    async def async_get(self) -> PT:
        print("get async")
        return cast(PT, None)

    def set(self, payload: PT) -> None:
        print("set sync")

    async def async_set(self, payload: PT) -> None:
        print("set async")
