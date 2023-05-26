import typing


class TaskDequequeOptions(object):
    def __init__(
        self,
        take_newest: typing.Optional[bool] = False,
    ) -> None:
        self.take_newest = take_newest

    @staticmethod
    def merge(
        item1: typing.Optional["TaskDequequeOptions"],
        item2: typing.Optional["TaskDequequeOptions"],
    ) -> typing.Optional["TaskDequequeOptions"]:
        if item2 is None:
            return item1
        return item2
