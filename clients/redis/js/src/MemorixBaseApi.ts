import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { CacheItem, PubsubItem, TaskItem } from "./types";
import { hashKey } from "./utils/hashKey";

export class MemorixBaseApi {
  private readonly redis: Redis;

  private readonly redisSub: Redis;

  private redisTasks: Redis[];

  constructor({ redisUrl }: { redisUrl: string }) {
    this.redis = new Redis(redisUrl);
    this.redisSub = this.redis.duplicate();
    this.redisTasks = [];
  }

  disconnect(): void {
    this.redis.disconnect();
    this.redisSub.disconnect();
    this.redisTasks.forEach((x) => {
      x.disconnect();
    });
  }

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
        const subscribersSize = await this.redis.publish(
          hashedKey,
          JSON.stringify(payload)
        );
        return { subscribersSize };
      },
      subscribe: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const callback = args.length === 1 ? args[0] : args[1];
        const hashedKey = hashPubsubKey(key);

        return new Promise((resolve, reject) => {
          this.redisSub.subscribe(hashedKey, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                stop: async () => {
                  await this.redisSub.unsubscribe(hashedKey);
                },
              });
            }
          });

          this.redisSub.on("message", (group, payload) => {
            if (hashedKey === group) {
              callback({ payload: JSON.parse(payload) });
            }
          });
        });
      },
    };
  }

  getTaskItem<Key, Payload, Returns>(
    identifier: string,
    hasReturns: Returns extends undefined ? false : true
  ): TaskItem<Key, Payload, Returns> {
    const hashPubsubKey = (key: Key | undefined) => {
      return hashKey(key ? [identifier, key] : [identifier]);
    };

    const returnTask = hasReturns
      ? this.getTaskItem<string, Returns, undefined>(
          `${identifier}_returns`,
          false
        )
      : undefined;

    return {
      queue: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const payload = args.length === 1 ? args[0] : args[1];
        const hashedKey = hashPubsubKey(key);
        const returnsId = hasReturns ? uuidv4() : undefined;

        const queueSize = await this.redis.rpush(
          hashedKey,
          JSON.stringify(hasReturns ? [returnsId, payload] : [payload])
        );

        const returnsPromise = hasReturns
          ? new Promise((res, rej) => {
              let stop: () => Promise<void> | undefined;
              returnTask!
                .dequeue(returnsId!, ({ payload: returns }) => {
                  stop();
                  res(returns);
                })
                .then((dequeueObj) => {
                  stop = dequeueObj.stop;
                })
                .catch(rej);
            })
          : undefined;

        if (hasReturns) {
          return {
            queueSize,
            getReturns: () => returnsPromise,
          };
        }
        return {
          queueSize,
        } as any;
      },
      dequeue: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const callback = args.length === 1 ? args[0] : args[1];
        const hashedKey = hashPubsubKey(key);

        const redisClient = this.redis.duplicate();
        this.redisTasks.push(redisClient);

        let stoppedPromise = new Promise((res) => {
          const cb = async (err: any, blpop: any) => {
            if (err) {
              res(err);
            }
            if (blpop) {
              redisClient.blpop(hashedKey, 0, cb);

              const [, wrapedPayloadStr] = blpop;
              const wrapedPayload = JSON.parse(wrapedPayloadStr);
              const payload: Payload = hasReturns
                ? wrapedPayload[1]
                : wrapedPayload[0];

              const result = callback({ payload });
              if (hasReturns) {
                const returnsId: string = wrapedPayload[0];
                const returns =
                  result instanceof Promise ? await result : result;
                await returnTask!.queue(returnsId, returns);
              }
            }
          };

          redisClient.blpop(hashedKey, 0, cb);
        });

        return {
          stop: async () => {
            redisClient.disconnect();
            const indexToRemove = this.redisTasks.indexOf(redisClient);
            if (indexToRemove !== -1) {
              this.redisTasks.splice(indexToRemove, 1);
            }
            await stoppedPromise;
          },
        };
      },
    };
  }
}
