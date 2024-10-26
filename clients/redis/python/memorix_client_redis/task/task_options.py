import typing


class TaskOptions(object):
    def __init__(
        self,
        queue_type: typing.Optional[str] = None,
    ) -> None:
        self.queue_type = queue_type
