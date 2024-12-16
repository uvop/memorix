import asyncio
import functools
from memorix_client_redis.hash_key import hash_key
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
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
        options: typing.Optional[TaskOptions] = None,
    ) -> None:
        self._api = api
        self._id = id
        self._payload_class = payload_class
        self._options = options if options is not None else TaskOptions(queue_type=None)
        self._has_key = True

    def _key(self, key: KT) -> str:
        return hash_key(api=self._api, id=self._id, key=key, has_key=self._has_key)

    def _enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        wrapped_payload_json = to_json(payload)

        queue_size = self._api._connection.redis.rpush(
            self._key(key=key),
            wrapped_payload_json,
        )
        return TaskItemQueue(queue_size=queue_size)

    async def _async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            functools.partial(
                TaskItem._enqueue,
                self=self,
                key=key,
            ),
        )

    def _dequeue(
        self,
        key: KT,
    ) -> typing.Generator[PT, None, None]:

        while True:
            if self._options.get_queue_type() == "lifo":
                [channel_bytes, data_bytes] = self._api._connection.redis.brpop(
                    self._key(key=key),
                )
            else:
                [channel_bytes, data_bytes] = self._api._connection.redis.blpop(
                    self._key(key=key),
                )

            payload_str = bytes_to_str(data_bytes)
            payload = typing.cast(
                PT,
                from_json(value=payload_str, data_class=self._payload_class),
            )

            yield payload

    async def _async_dequeue(
        self,
        key: KT,
    ) -> typing.AsyncGenerator[PT, None]:
        print("dequeue async")
        yield typing.cast(PT, None)

    def _empty(self, key: KT) -> None:
        self._api._connection.redis.delete(
            self._key(key=key),
        )

    async def _async_empty(self, key: KT) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            functools.partial(
                TaskItem._empty,
                self=self,
                key=key,
            ),
        )

    def _get_len(self, key: KT) -> int:
        return self._api._connection.redis.llen(
            self._key(key=key),
        )

    async def _async_get_len(self, key: KT) -> int:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            functools.partial(
                TaskItem._get_len,
                self=self,
                key=key,
            ),
        )


class TaskItemTTTT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemTTTF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)


class TaskItemTTFT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemTTFF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)


class TaskItemTFTT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemTFTF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)


class TaskItemTFFT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemTFFF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return self._enqueue(key=key, payload=payload)

    async def async_enqueue(self, key: KT, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue(key=key, payload=payload)


class TaskItemFTTT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemFTTF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)


class TaskItemFTFT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemFTFF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def dequeue(self, key: KT) -> typing.Generator[PT, None, None]:
        return self._dequeue(key=key)

    async def async_dequeue(self, key: KT) -> typing.AsyncGenerator[PT, None]:
        return self._async_dequeue(key=key)


class TaskItemFFTT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemFFTF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def empty(self, key: KT) -> None:
        self._empty(key=key)

    async def async_empty(self, key: KT) -> None:
        await self._async_empty(key=key)


class TaskItemFFFT(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)

    def get_len(self, key: KT) -> int:
        return self._get_len(key=key)

    async def async_get_len(self, key: KT) -> int:
        return await self._async_get_len(key=key)


class TaskItemFFFF(TaskItem[KT, PT]):
    def key(self, key: KT) -> str:
        return self._key(key=key)


class TaskItemNoKey(TaskItem[None, PT]):
    def __init__(
        self,
        api: MemorixBase,
        id: str,
        payload_class: typing.Any,
        options: typing.Optional[TaskOptions] = None,
    ) -> None:
        super().__init__(api=api, id=id, payload_class=payload_class, options=options)
        self._has_key = False

    def _key_no_key(self) -> str:
        return TaskItem._key(self, key=None)

    def _enqueue_no_key(self, payload: PT) -> TaskItemQueue:
        return TaskItem._enqueue(self, key=None, payload=payload)

    async def _async_enqueue_no_key(self, payload: PT) -> TaskItemQueue:
        return TaskItem._enqueue(self, key=None, payload=payload)

    def _dequeue_no_key(
        self,
    ) -> typing.Generator[PT, None, None]:
        return TaskItem._dequeue(self, key=None)

    async def _async_dequeue_no_key(
        self,
    ) -> typing.AsyncGenerator[PT, None]:
        return TaskItem._async_dequeue(self, key=None)

    def _empty_no_key(self) -> None:
        TaskItem._empty(self, key=None)

    async def _async_empty_no_key(self) -> None:
        await TaskItem._async_empty(self, key=None)

    def _get_len_no_key(self) -> int:
        return TaskItem._get_len(self, key=None)

    async def _async_get_len_no_key(self) -> int:
        return await TaskItem._async_get_len(self, key=None)


class TaskItemTTTTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemTTTFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()


class TaskItemTTFTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemTTFFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()


class TaskItemTFTTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemTFTFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()


class TaskItemTFFTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemTFFFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def enqueue(self, payload: PT) -> TaskItemQueue:
        return self._enqueue_no_key(payload=payload)

    async def async_enqueue(self, payload: PT) -> TaskItemQueue:
        return await self._async_enqueue_no_key(payload=payload)


class TaskItemFTTTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemFTTFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()


class TaskItemFTFTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemFTFFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def dequeue(self) -> typing.Generator[PT, None, None]:
        return self._dequeue_no_key()

    async def async_dequeue(self) -> typing.AsyncGenerator[PT, None]:
        return await self._async_dequeue_no_key()


class TaskItemFFTTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemFFTFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def empty(self) -> None:
        self._empty_no_key()

    async def async_empty(self) -> None:
        await self._async_empty_no_key()


class TaskItemFFFTNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()

    def get_len(self) -> int:
        return self._get_len_no_key()

    async def async_get_len(self) -> int:
        return await self._async_get_len_no_key()


class TaskItemFFFFNoKey(TaskItemNoKey[PT]):
    def key(self) -> str:
        return self._key_no_key()
