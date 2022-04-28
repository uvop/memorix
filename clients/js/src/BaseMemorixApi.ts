/* eslint-disable class-methods-use-this */
import Redis from "ioredis";

import { CacheItem, GlobalCacheItem } from "./types";

export class BaseMemorixApi {
  redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_ENV as string);
  }

  getCacheItem<Payload>(identifier: string): GlobalCacheItem<Payload>;
  getCacheItem<Key, Payload>(identifier: string): CacheItem<Key, Payload>;
  getCacheItem<Key, Payload>(identifier: string): any {
    console.log(identifier);

    return {
      set: async (...args: [Key, Payload] | [Payload]) => {
        const key = args.length === 1 ? undefined : args[0];
        const payload = args.length === 1 ? args[0] : args[1];
        const hashedKey = key ? identifier + key : identifier;
        await this.redis.set(hashedKey, JSON.stringify(payload));
        return Promise.resolve();
      },
      get: async (key?: Key) => {
        console.log(key);
        const hashedKey = key ? identifier + key : identifier;
        const found = await this.redis.get(hashedKey);
        if (found) {
          return JSON.parse(found);
        }
        return null;
      },
    };
  }
}
