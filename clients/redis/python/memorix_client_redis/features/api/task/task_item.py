import asyncio
import functools
from memorix_client_redis.features.api.hash_key import hash_key
from uuid import uuid4
from memorix_client_redis.features.api.json import from_json, to_json, bytes_to_str
import typing
from ..api import Api, ApiDefaults
from .task_options import TaskDequequeOptions

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")
RT = typing.TypeVar("RT")


class TaskItemQueue(object):
    def __init__(self, queue_size: int) -> None:
        self.queue_size = queue_size


class TaskItemQueueWithReturns(TaskItemQueue, typing.Generic[RT]):
    def __init__(
        self,
        queue_size: int,
        returns_id: str,
        returns_task: typing.Any,
    ) -> None:
        self.queue_size = queue_size
        self._returns_id = returns_id
        self._returns_task = returns_task

    def get_returns(self) -> RT:
        payload = None
        for message in self._returns_task.dequeue(key=self._returns_id):
            payload = message.payload
            break
        return typing.cast(RT, payload)

    async def async_get_returns(self) -> RT:
        payload = None
        async for message in self._returns_task.async_dequeue(key=self._returns_id):
            payload = message.payload
            break
        return typing.cast(RT, payload)


class TaskItemDequeue(typing.Generic[PT]):
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
        returns_task: typing.Any,
    ) -> None:
        super().__init__(payload=payload)
        self._returns_id = returns_id
        self._returns_task = returns_task

    def send_returns(self, returns: RT) -> TaskItemQueue:
        return typing.cast(
            TaskItemQueue,
            self._returns_task.queue(key=self._returns_id, payload=returns),
        )

    async def async_send_returns(self, returns: RT) -> TaskItemQueue:
        return typing.cast(
            TaskItemQueue,
            self._returns_task.async_queue(key=self._returns_id, payload=returns),
        )


class TaskItem(typing.Generic[KT, PT, RT]):
    def __init__(
        self,
        api: Api,
        id: str,
        payload_class: typing.Type[PT],
        returns_class: typing.Optional[typing.Type[RT]] = None,
        options: typing.Optional[TaskDequequeOptions] = None,
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
        self._options = options

    def queue(self, key: KT, payload: PT) -> TaskItemQueueWithReturns[RT]:
        returns_id: str | None = None
        if hasattr(self, "_returns_task"):
            returns_id = str(uuid4())
            wrapped_payload_json = to_json(
                [returns_id, payload],
            )
        else:
            wrapped_payload_json = to_json(
                [payload],
            )

        queue_size = self._api._redis.rpush(
            hash_key(self._id, key=key),
            wrapped_payload_json,
        )
        if returns_id is None:
            return typing.cast(
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
        return typing.cast(TaskItemQueueWithReturns[RT], None)

    def dequeue(
        self,
        key: KT,
        options: typing.Optional[TaskDequequeOptions] = None,
    ) -> typing.Generator[TaskItemDequeueWithReturns[PT], None, None]:
        take_newest: typing.Optional[bool] = None
        try:
            take_newest = typing.cast(TaskDequequeOptions, options).take_newest
        except AttributeError:
            try:
                take_newest = typing.cast(
                    TaskDequequeOptions,
                    typing.cast(ApiDefaults, self._api._defaults).task_dequeque_options,
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

            data_str = bytes_to_str(data_bytes)

            if hasattr(self, "_returns_task"):
                seperator_index = data_str.index(",")
                returns_id = data_str[2 : seperator_index - 1]
                payload_str = data_str[seperator_index + 1 : -1]
                payload = from_json(
                    payload_str,
                    self._payload_class,
                )
                yield TaskItemDequeueWithReturns(
                    payload=payload,
                    returns_id=returns_id,
                    returns_task=self._returns_task,
                )
            else:
                payload_str = data_str[1:-1]
                payload = from_json(payload_str, self._payload_class)

                yield typing.cast(
                    TaskItemDequeueWithReturns[PT],
                    TaskItemDequeue(payload=payload),
                )

    async def async_dequeue(
        self,
        key: KT,
    ) -> typing.AsyncGenerator[TaskItemDequeueWithReturns[PT], None]:
        print("dequeue async")
        yield typing.cast(TaskItemDequeueWithReturns[PT], None)

    def clear(self, key: KT) -> None:
        self._api._redis.delete(
            hash_key(self._id, key=key),
        )

    async def async_clear(self, key: KT) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                TaskItem.clear,
                self=self,
                key=key,
            ),
        )


class TaskItemNoKey(TaskItem[None, PT, RT]):
    # Different signature on purpose
    def queue(self, payload: PT) -> TaskItemQueueWithReturns[RT]:  # type: ignore
        return TaskItem.queue(self, key=None, payload=payload)

    # Different signature on purpose
    async def async_queue(self, payload: PT) -> TaskItemQueueWithReturns[RT]:  # type: ignore
        return await TaskItem.async_queue(self, key=None, payload=payload)

    # Different signature on purpose
    def dequeue(self) -> typing.Generator[TaskItemDequeueWithReturns[PT], None, None]:  # type: ignore
        return TaskItem.dequeue(self, key=None)

    # Different signature on purpose
    async def async_dequeue(self) -> typing.AsyncGenerator[TaskItemDequeueWithReturns[PT], None]:  # type: ignore
        return TaskItem.async_dequeue(self, key=None)

    # Different signature on purpose
    def clear(self) -> None:  # type: ignore
        TaskItem.clear(self, key=None)

    # Different signature on purpose
    async def async_clear(self) -> None:  # type: ignore
        await TaskItem.async_clear(self, key=None)


class TaskItemNoReturns(TaskItem[KT, PT, None]):
    def __init__(
        self,
        api: Api,
        id: str,
        payload_class: typing.Type[PT],
    ) -> None:
        super().__init__(
            api=api,
            id=id,
            payload_class=payload_class,
            returns_class=None,
        )

    # Different signature on purpose
    def queue(self, key: KT, payload: PT) -> TaskItemQueue:  # type: ignore
        return typing.cast(
            TaskItemQueue,
            TaskItem.queue(self, key=key, payload=payload),
        )

    # Different signature on purpose
    async def async_queue(self, key: KT, payload: PT) -> TaskItemQueue:  # type: ignore
        return await TaskItem.async_queue(self, key=key, payload=payload)

    # Different signature on purpose
    def dequeue(self, key: KT) -> typing.Generator[TaskItemDequeue[PT], None, None]:  # type: ignore
        return TaskItem.dequeue(self, key=key)

    # Different signature on purpose
    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[TaskItemDequeue[PT], None]:  # type: ignore
        return TaskItem.async_dequeue(self, key=key)

    # Different signature on purpose
    def clear(self, key: KT) -> None:
        TaskItem.clear(self, key=key)

    # Different signature on purpose
    async def async_clear(self, key: KT) -> None:
        await TaskItem.async_clear(self, key=key)


class TaskItemNoKeyNoReturns(TaskItemNoReturns[None, PT]):
    # Different signature on purpose
    def queue(self, payload: PT) -> TaskItemQueue:  # type: ignore
        return typing.cast(
            TaskItemQueue,
            TaskItem.queue(self, key=None, payload=payload),
        )

    # Different signature on purpose
    async def async_queue(self, payload: PT) -> TaskItemQueue:  # type: ignore
        return await TaskItem.async_queue(self, key=None, payload=payload)

    # Different signature on purpose
    def dequeue(self) -> typing.Generator[TaskItemDequeue[PT], None, None]:  # type: ignore
        return TaskItem.dequeue(self, key=None)

    # Different signature on purpose
    async def async_dequeue(self) -> typing.AsyncGenerator[TaskItemDequeue[PT], None]:  # type: ignore
        return TaskItem.async_dequeue(self, key=None)

    # Different signature on purpose
    def clear(self) -> None:  # type: ignore
        TaskItem.clear(self, key=None)

    # Different signature on purpose
    async def async_clear(self) -> None:  # type: ignore
        await TaskItem.async_clear(self, key=None)
