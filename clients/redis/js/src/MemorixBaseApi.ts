import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import callbackToAsyncIterator from "callback-to-async-iterator";
import {
  CacheItem,
  CacheSetOptions,
  TaskDequequeOptions,
  PubsubCallback,
  PubsubItem,
  TaskItem,
  CacheItemNoKey,
  PubsubItemNoKey,
  TaskItemNoKey,
} from "./types";
import { hashKey } from "./utils/hashKey";

type Defaults = {
  cacheSetOptions?: CacheSetOptions;
  taskDequequeOptions?: TaskDequequeOptions;
};

export class MemorixBaseApi {
  private readonly redis: Redis;

  private readonly redisSub: Redis;

  private readonly defaults?: Defaults;

  private redisTasks: Redis[];

  constructor({
    redisUrl,
    defaults,
  }: {
    redisUrl: string;
    defaults?: Defaults;
  }) {
    this.redis = new Redis(redisUrl);
    this.redisSub = this.redis.duplicate();
    this.redisTasks = [];
    this.defaults = defaults;
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
      set: async (key, payload, options) => {
        const { expire = undefined } = {
          ...this.defaults?.cacheSetOptions,
          ...options,
        };
        const hashedKey = hashCacheKey(key);
        const params = expire
          ? [expire.isInMs ? "PX" : "EX", expire.value.toString()]
          : [];
        await this.redis.set(
          hashedKey,
          JSON.stringify(payload),
          ...(params as any)
        );
      },
      get: async (key) => {
        const hashedKey = hashCacheKey(key);
        const found = await this.redis.get(hashedKey);
        if (found) {
          return JSON.parse(found) as Payload;
        }
        return null;
      },
    };
  }

  getCacheItemNoKey<Payload>(
    ...itemArgs: Parameters<typeof this.getCacheItem>
  ): CacheItemNoKey<Payload> {
    const item = this.getCacheItem<undefined, Payload>(...itemArgs);

    return {
      get: (...args) => item.get(undefined, ...args),
      set: (...args) => item.set(undefined, ...args),
    };
  }

  getPubsubItem<Key, Payload>(identifier: string): PubsubItem<Key, Payload> {
    const hashPubsubKey = (key: Key | undefined) => {
      return hashKey(key ? [identifier, key] : [identifier]);
    };

    return {
      publish: async (key, payload) => {
        const hashedKey = hashPubsubKey(key);
        const subscribersSize = await this.redis.publish(
          hashedKey,
          JSON.stringify(payload)
        );
        return { subscribersSize };
      },
      subscribe: ((
        key: Key,
        callback: PubsubCallback<{ payload: Payload }> | undefined
      ) => {
        const hashedKey = hashPubsubKey(key);

        const getListenPromise = (cb: NonNullable<typeof callback>) =>
          new Promise<{ stop(): Promise<void> }>((resolve, reject) => {
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
                cb({ payload: JSON.parse(payload) });
              }
            });
          });

        if (callback === undefined) {
          return callbackToAsyncIterator<
            { payload: Payload },
            { stop: () => Promise<void> }
          >((cb) => getListenPromise(cb), {
            onClose({ stop }) {
              stop();
            },
          });
        }

        return getListenPromise(callback);
      }) as any,
    };
  }

  getPubsubItemNoKey<Payload>(
    ...itemArgs: Parameters<typeof this.getPubsubItem>
  ): PubsubItemNoKey<Payload> {
    const item = this.getPubsubItem<undefined, Payload>(...itemArgs);

    return {
      publish: (...args) => item.publish(undefined, ...args),
      subscribe: (...args) => (item.subscribe as any)(undefined, ...args),
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
      queue: async (key, payload) => {
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
      dequeue: async (key, callback, options) => {
        const hashedKey = hashPubsubKey(key);
        const { takeNewest = false } = {
          ...this.defaults?.taskDequequeOptions,
          ...options,
        };

        const redisClient = this.redis.duplicate();
        this.redisTasks.push(redisClient);

        const stoppedPromise = new Promise((res) => {
          const cb = async (err: any, blpop: any) => {
            if (err) {
              res(err);
            }
            if (blpop) {
              redisClient[takeNewest ? "brpop" : "blpop"](hashedKey, 0, cb);

              const [, wrapedPayloadStr] = blpop;
              const wrapedPayload = JSON.parse(wrapedPayloadStr);
              const payload: Payload = hasReturns
                ? wrapedPayload[1]
                : wrapedPayload[0];

              const result = callback({ payload });
              if (hasReturns) {
                const returnsId: string = wrapedPayload[0];
                const returns = (
                  result instanceof Promise ? await result : result
                ) as Returns;
                await returnTask!.queue(returnsId, returns);
              }
            }
          };

          redisClient[takeNewest ? "brpop" : "blpop"](hashedKey, 0, cb);
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

  getTaskItemNoKey<Payload, Returns>(
    ...itemArgs: any[]
  ): TaskItemNoKey<Payload, Returns> {
    const item = (this.getTaskItem as any)(...itemArgs);

    return {
      queue: (...args) => item.queue(undefined, ...args),
      dequeue: (...args) => item.dequeue(undefined, ...args),
    };
  }
}
