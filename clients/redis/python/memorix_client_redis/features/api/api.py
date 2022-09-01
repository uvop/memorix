from redis import Redis


class Api(object):
    def __init__(self, redis_url: str) -> None:
        self._redis = Redis.from_url(redis_url)
        self._pubsub = self._redis.pubsub()
