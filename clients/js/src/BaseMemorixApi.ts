import Redis from "ioredis";
import { CacheItem } from "./types";
import { hashKey } from "./utils/hashKey";

export class BaseMemorixApi {
  readonly redis = new Redis(process.env.REDIS_ENV!);

  getCacheItem<Key, Payload>(identifier: string): CacheItem<Key, Payload> {
    const hashCacheKey = (key: Key | undefined) => {
      return hashKey(key ? [identifier, key] : [identifier]);
    };

    return {
      set: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const payload = args.length === 1 ? args[0] : args[1];
        const hashedKey = hashCacheKey(key);
        await this.redis.set(hashedKey, JSON.stringify(payload));
      },
      get: async (...[key]) => {
        const hashedKey = hashCacheKey(key);
        const found = await this.redis.get(hashedKey);
        if (found) {
          return JSON.parse(found) as Payload;
        }
        return null;
      },
    };
  }
}
