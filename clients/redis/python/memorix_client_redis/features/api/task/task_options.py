from typing import Optional


class TaskDequequeOptions:
    def __init__(
        self,
        take_newest: Optional[bool] = False,
    ) -> None:
        self.take_newest = take_newest
