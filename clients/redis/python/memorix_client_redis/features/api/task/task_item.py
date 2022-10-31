from memorix_client_redis.features.api.hash_key import hash_key
from uuid import uuid4
from memorix_client_redis.features.api.json import (
    from_dict,
    from_json_to_any,
    to_json_serializable,
    to_json_from_json_serializable,
)
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
from ..api import Api, ApiDefaults
from .task_options import TaskDequequeOptions

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
        payload_serializeable = to_json_serializable(value=payload)
        if hasattr(self, "_returns_task"):
            returns_id = str(uuid4())
            wrapped_payload_json = to_json_from_json_serializable(
                [returns_id, payload_serializeable],
            )
        else:
            wrapped_payload_json = to_json_from_json_serializable(
                [payload_serializeable],
            )

        queue_size = self._api._redis.rpush(
            hash_key(self._id, key=key),
            wrapped_payload_json,
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

    def dequeue(
        self,
        key: KT,
        options: Optional[TaskDequequeOptions] = None,
    ) -> Generator[TaskItemDequeueWithReturns[PT], None, None]:
        take_newest: Optional[bool] = None
        try:
            take_newest = cast(TaskDequequeOptions, options).take_newest
        except AttributeError:
            try:
                take_newest = cast(
                    TaskDequequeOptions,
                    cast(ApiDefaults, self._api._defaults).task_dequeque_options,
                ).take_newest
            except AttributeError:
                pass

        while True:
            if take_newest:
                [channel_bytes, data_bytes] = self._api._redis.brpop(
                    hash_key(self._id, key=key),
                )
            else:
                [channel_bytes, data_bytes] = self._api._redis.blpop(
                    hash_key(self._id, key=key),
                )

            wrapped_payload = from_json_to_any(data_bytes)
            if hasattr(self, "_returns_task"):
                returns_id = wrapped_payload[0]
                payload_dict = wrapped_payload[1]
                payload = from_dict(dict=payload_dict, data_class=self._payload_class)
                yield TaskItemDequeueWithReturns(
                    payload=payload,
                    returns_id=returns_id,
                    returns_task=self._returns_task,
                )
            else:
                payload_dict = wrapped_payload[0]
                payload = from_dict(dict=payload_dict, data_class=self._payload_class)

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
