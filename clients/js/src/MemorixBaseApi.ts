import Redis from "ioredis";
import { CacheItem, PubsubItem } from "./types";
import { hashKey } from "./utils/hashKey";

export class MemorixBaseApi {
  readonly redis = new Redis(process.env.REDIS_ENV!);

  readonly redisSub = new Redis(process.env.REDIS_ENV!);

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

  getPubsubItem<Key, Payload>(identifier: string): PubsubItem<Key, Payload> {
    const hashPubsubKey = (key: Key | undefined) => {
      return hashKey(key ? [identifier, key] : [identifier]);
    };

    return {
      publish: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const payload = args.length === 1 ? args[0] : args[1];
        const hashedKey = hashPubsubKey(key);
        await this.redis.publish(hashedKey, JSON.stringify(payload));
      },
      subscribe: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const callback = args.length === 1 ? args[0] : args[1];
        const hashedKey = hashPubsubKey(key);

        return new Promise((resolve, reject) => {
          this.redisSub.subscribe(hashedKey, (err, count) => {
            if (err) {
              console.error("Failed to subscribe: %s", err.message);
              reject(err);
            } else {
              console.log(
                `Subscribed successfully! This client is currently subscribed to ${count} channels.`
              );
              resolve();
            }
          });

          this.redisSub.on("message", (group, payload) => {
            if (hashedKey === group) {
              // console.log(`got payload ${payload} in key ${group}`);
              callback(payload);
            }
          });
        });
      },
    };
  }
}
