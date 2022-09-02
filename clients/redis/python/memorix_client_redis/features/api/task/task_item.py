from dataclasses import dataclass
from memorix_client_redis.features.api.hash_key import hash_key
from uuid import uuid4
from memorix_client_redis.features.api.json import (
    from_dict,
    from_json,
    from_json_to_dict,
    to_json,
)
from ..api import Api
from typing import (
    Any,
    AsyncGenerator,
    Generator,
    Generic,
    Type,
    TypeVar,
    cast,
    Optional,
)

KT = TypeVar("KT")
PT = TypeVar("PT")
RT = TypeVar("RT")


class TaskItemQueue(object):
    def __init__(self, queue_size: int) -> None:
        self.queue_size = queue_size


class TaskItemQueueWithReturns(TaskItemQueue, Generic[RT]):
    def __init__(
        self,
        queue_size: int,
        returns_id: str,
        returns_task: Any,
    ) -> None:
        self.queue_size = queue_size
        self._returns_id = returns_id
        self._returns_task = returns_task

    def get_returns(self) -> RT:
        payload = None
        for message in self._returns_task.dequeue(key=self._returns_id):
            payload = message.payload
            break
        return cast(RT, payload)

    async def async_get_returns(self) -> RT:
        payload = None
        async for message in self._returns_task.async_dequeue(key=self._returns_id):
            payload = message.payload
            break
        return cast(RT, payload)


class TaskItemDequeue(Generic[PT]):
    def __init__(
        self,
        payload: PT,
    ) -> None:
        self.payload = payload


class TaskItemDequeueWithReturns(TaskItemDequeue[PT]):
    def __init__(
        self,
        payload: PT,
        returns_id: str,
        returns_task: Any,
    ) -> None:
        super().__init__(payload=payload)
        self._returns_id = returns_id
        self._returns_task = returns_task

    def send_returns(self, returns: RT) -> TaskItemQueue:
        return cast(
            TaskItemQueue,
            self._returns_task.queue(key=self._returns_id, payload=returns),
        )

    async def async_send_returns(self, returns: RT) -> TaskItemQueue:
        return cast(
            TaskItemQueue,
            self._returns_task.async_queue(key=self._returns_id, payload=returns),
        )


@dataclass
class TaskPayload(Generic[PT]):
    returns_id: str
    payload: PT


class TaskItem(Generic[KT, PT, RT]):
    def __init__(
        self,
        api: Api,
        id: str,
        payload_class: Type[PT],
        returns_class: Optional[Type[RT]] = None,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        if returns_class is not None:
            self._returns_task = TaskItemNoReturns[str, RT](
                api=api,
                id="{0}_returns".format(id),
                payload_class=returns_class,
            )

    def queue(self, key: KT, payload: PT) -> TaskItemQueueWithReturns[RT]:
        returns_id: str | None = None
        if hasattr(self, "_returns_task"):
            returns_id = str(uuid4())
            payload_json = to_json(TaskPayload(returns_id=returns_id, payload=payload))
        else:
            payload_json = to_json(payload)

        queue_size = self._api._redis.rpush(
            hash_key(self._id, key=key),
            payload_json,
        )
        if returns_id is None:
            return cast(
                TaskItemQueueWithReturns[RT],
                TaskItemQueue(queue_size=queue_size),
            )
        return TaskItemQueueWithReturns(
            queue_size=queue_size,
            returns_id=returns_id,
            returns_task=self._returns_task,
        )

    async def async_queue(self, key: KT, payload: PT) -> TaskItemQueueWithReturns[RT]:
        print("queue async")
        return cast(TaskItemQueueWithReturns[RT], None)

    def dequeue(self, key: KT) -> Generator[TaskItemDequeueWithReturns[PT], None, None]:
        while True:
            [channel_bytes, data_bytes] = self._api._redis.blpop(
                hash_key(self._id, key=key),
            )
            if hasattr(self, "_returns_task"):
                dict = from_json_to_dict(data_bytes)
                payload_dict = dict["payload"]
                payload = from_dict(dict=payload_dict, data_class=self._payload_class)
                returns_id = dict["returns_id"]

                yield TaskItemDequeueWithReturns(
                    payload=payload,
                    returns_id=returns_id,
                    returns_task=self._returns_task,
                )
            else:
                payload = from_json(value=data_bytes, data_class=self._payload_class)

                yield cast(
                    TaskItemDequeueWithReturns[PT],
                    TaskItemDequeue(payload=payload),
                )

    async def async_dequeue(
        self,
        key: KT,
    ) -> AsyncGenerator[TaskItemDequeueWithReturns[PT], None]:
        print("dequeue async")
        yield cast(TaskItemDequeueWithReturns[PT], None)


class TaskItemNoKey(TaskItem[None, PT, RT]):
    # Different signature on purpose
    def queue(self, payload: PT) -> TaskItemQueueWithReturns[RT]:  # type: ignore
        return TaskItem.queue(self, key=None, payload=payload)

    # Different signature on purpose
    async def async_queue(self, payload: PT) -> TaskItemQueueWithReturns[RT]:  # type: ignore
        return await TaskItem.async_queue(self, key=None, payload=payload)

    # Different signature on purpose
    def dequeue(self) -> Generator[TaskItemDequeueWithReturns[PT], None, None]:  # type: ignore
        return TaskItem.dequeue(self, key=None)

    # Different signature on purpose
    async def async_dequeue(self) -> AsyncGenerator[TaskItemDequeueWithReturns[PT], None]:  # type: ignore
        return TaskItem.async_dequeue(self, key=None)


class TaskItemNoReturns(TaskItem[KT, PT, None]):
    def __init__(
        self,
        api: Api,
        id: str,
        payload_class: Type[PT],
    ) -> None:
        super().__init__(
            api=api,
            id=id,
            payload_class=payload_class,
            returns_class=None,
        )

    # Different signature on purpose
    def queue(self, key: KT, payload: PT) -> TaskItemQueue:  # type: ignore
        return cast(TaskItemQueue, TaskItem.queue(self, key=key, payload=payload))

    # Different signature on purpose
    async def async_queue(self, key: KT, payload: PT) -> TaskItemQueue:  # type: ignore
        return await TaskItem.async_queue(self, key=key, payload=payload)

    # Different signature on purpose
    def dequeue(self, key: KT) -> Generator[TaskItemDequeue[PT], None, None]:  # type: ignore
        return TaskItem.dequeue(self, key=key)

    # Different signature on purpose
    async def async_dequeue(self, key: KT) -> AsyncGenerator[TaskItemDequeue[PT], None]:  # type: ignore
        return TaskItem.async_dequeue(self, key=key)


class TaskItemNoKeyNoReturns(TaskItemNoReturns[None, PT]):
    # Different signature on purpose
    def queue(self, payload: PT) -> TaskItemQueue:  # type: ignore
        return cast(TaskItemQueue, TaskItem.queue(self, key=None, payload=payload))

    # Different signature on purpose
    async def async_queue(self, payload: PT) -> TaskItemQueue:  # type: ignore
        return await TaskItem.async_queue(self, key=None, payload=payload)

    # Different signature on purpose
    def dequeue(self) -> Generator[TaskItemDequeue[PT], None, None]:  # type: ignore
        return TaskItem.dequeue(self, key=None)

    # Different signature on purpose
    async def async_dequeue(self) -> AsyncGenerator[TaskItemDequeue[PT], None]:  # type: ignore
        return TaskItem.async_dequeue(self, key=None)
