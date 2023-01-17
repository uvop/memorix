from typing import Any, Callable, TypeVar
from async_timeout import timeout
import asyncio
import pytest

RT = TypeVar("RT")


def with_timeout(seconds: int) -> Callable[[Callable[..., RT]], Callable[..., RT]]:
    def wrapper(corofunc: Any) -> Any:  # noqa: WPS430
        async def run(*args: Any, **kwargs: Any) -> Any:  # noqa: WPS430
            async with timeout(seconds):
                try:
                    return await corofunc(*args, **kwargs)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pytest.fail("Test did not finish in time.")

        return run

    return wrapper
