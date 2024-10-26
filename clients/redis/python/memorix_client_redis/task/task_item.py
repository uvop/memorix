import asyncio
import functools
from memorix_client_redis.hash_key import hash_key
from uuid import uuid4
from memorix_client_redis.json import from_json, to_json, bytes_to_str
import typing
from memorix_client_redis.memorix_base import MemorixBase
from .task_options import TaskOptions

KT = typing.TypeVar("KT")
PT = typing.TypeVar("PT")


class TaskItemQueue(object):
    def __init__(self, queue_size: int) -> None:
        self.queue_size = queue_size


class TaskItem(typing.Generic[KT, PT]):
    Options = TaskOptions

    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Type[PT],
        options: typing.Optional[TaskOptions] = None,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._options = options

    def queue(self, key: KT, payload: PT) -> TaskItemQueue:
        wrapped_payload_json = to_json(
            [payload],
        )

        queue_size = self._api._connection.redis.rpush(
            hash_key(api=self._api, id=self._id, key=key),
            wrapped_payload_json,
        )
        return TaskItemQueue(queue_size=queue_size)

    async def async_queue(self, key: KT, payload: PT) -> TaskItemQueue:
        print("queue async")
        return typing.cast(TaskItemQueue, None)

    def dequeue(
        self,
        key: KT,
    ) -> typing.Generator[PT, None, None]:

        while True:
            if self._options is not None and self._options.queue_type == "lifo":
                [channel_bytes, data_bytes] = self._api._connection.redis.brpop(
                    hash_key(api=self._api, id=self._id, key=key),
                )
            else:
                [channel_bytes, data_bytes] = self._api._connection.redis.blpop(
                    hash_key(api=self._api, id=self._id, key=key),
                )

            data_str = bytes_to_str(data_bytes)

            payload_str = data_str[1:-1]
            payload = from_json(payload_str, self._payload_class)

            yield payload

    async def async_dequeue(
        self,
        key: KT,
    ) -> typing.AsyncGenerator[PT, None]:
        print("dequeue async")
        yield typing.cast(PT, None)

    def clear(self, key: KT) -> None:
        self._api._connection.redis.delete(
            hash_key(api=self._api, id=self._id, key=key),
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


class TaskItemNoKey(TaskItem[None, PT]):
    # Different signature on purpose
    def queue(self, payload: PT) -> TaskItemQueue:  # type: ignore
        return TaskItem.queue(self, key=None, payload=payload)

    # Different signature on purpose
    async def async_queue(self, payload: PT) -> TaskItemQueue:  # type: ignore
        return await TaskItem.async_queue(self, key=None, payload=payload)

    # Different signature on purpose
    def dequeue(self) -> typing.Generator[TaskItemDequeue, None, None]:  # type: ignore
        return TaskItem.dequeue(self, key=None)

    # Different signature on purpose
    async def async_dequeue(self) -> typing.AsyncGenerator[TaskItemDequeue, None]:  # type: ignore
        return TaskItem.async_dequeue(self, key=None)

    # Different signature on purpose
    def clear(self) -> None:  # type: ignore
        TaskItem.clear(self, key=None)

    # Different signature on purpose
    async def async_clear(self) -> None:  # type: ignore
        await TaskItem.async_clear(self, key=None)
