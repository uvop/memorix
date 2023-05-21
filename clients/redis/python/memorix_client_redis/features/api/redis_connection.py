from redis import Redis


class RedisConnection(object):
    def __init__(
        self,
        redis_url: str,
    ) -> None:
        self.redis = Redis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()
