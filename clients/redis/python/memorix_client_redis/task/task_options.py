import typing
from ..value import Value


class TaskOptions(object):
    def __init__(
        self,
        queue_type: typing.Optional[Value] = None,
    ) -> None:
        self.queue_type = queue_type

    def get_queue_type(self) -> str:
        if self.queue_type is None:
            return "fifo"
        return self.queue_type.require()
