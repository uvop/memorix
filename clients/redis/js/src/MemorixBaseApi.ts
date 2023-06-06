// eslint-disable-next-line max-classes-per-file
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import callbackToAsyncIterator from "callback-to-async-iterator";
import {
  CacheItem,
  CacheOptions,
  TaskOptions,
  PubsubItem,
  TaskItem,
  CacheItemNoKey,
  PubsubItemNoKey,
  TaskItemNoKey,
} from "./types";
import { hashKey } from "./utils/hashKey";

type Defaults = {
  cacheOptions?: CacheOptions;
  taskOptions?: TaskOptions;
};

export class MemorixBaseApi {
  public static fromConfig: (config: {
    defaultOptions: { cache?: CacheOptions; task?: TaskOptions };
  }) => typeof MemorixBaseApi = ({ defaultOptions }) =>
    class MemorixBaseApiWithConfig extends MemorixBaseApi {
      constructor(options) {
        super({
          ...options,
          defaults: {
            ...(defaultOptions.cache
              ? {
                  cacheOptions: defaultOptions.cache,
                }
              : {}),
            ...(defaultOptions.task
              ? {
                  taskOptions: defaultOptions.task,
                }
              : {}),
            ...options.defaults,
          },
        });
      }
    };

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
    this.redis = new Redis(redisUrl, { lazyConnect: true });
    this.redisSub = this.redis.duplicate();
    this.redisTasks = [];
    this.defaults = defaults;
  }

  async connect(): Promise<void> {
    await this.redis.connect();
    await this.redisSub.connect();
  }

  disconnect(): void {
    this.redis.disconnect();
    this.redisSub.disconnect();
    this.redisTasks.forEach((x) => {
      x.disconnect();
    });
  }

  getCacheItem<Key, Payload>(
    identifier: string,
    iOptions?: CacheOptions
  ): CacheItem<Key, Payload> {
    const hashCacheKey = (key: Key | undefined) => {
      return hashKey(key ? [identifier, key] : [identifier]);
    };

    const cacheItem: CacheItem<Key, Payload> = {
      set: async (key, payload, options) => {
        const { expire = undefined } = {
          ...this.defaults?.cacheOptions,
          ...iOptions,
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
      get: async (key, options) => {
        const { expire } = {
          ...this.defaults?.cacheOptions,
          ...iOptions,
          ...options,
        };
        const hashedKey = hashCacheKey(key);
        const found = await this.redis.get(hashedKey);
        if (!found) {
          return null;
        }
        if (expire?.extendOnGet) {
          await cacheItem.extend(key);
        }
        return JSON.parse(found) as Payload;
      },
      extend: async (key) => {
        const { expire = undefined } = {
          ...this.defaults?.cacheOptions,
          ...iOptions,
        };

        if (!expire) {
          return;
        }

        const hashedKey = hashCacheKey(key);
        if (expire.isInMs) {
          await this.redis.pexpire(hashedKey, expire.value);
        } else {
          await this.redis.expire(hashedKey, expire.value);
        }
      },
    };
    return cacheItem;
  }

  getCacheItemNoKey<Payload>(...itemArgs: any[]): CacheItemNoKey<Payload> {
    const item = (this.getCacheItem as any)(...itemArgs);

    return {
      get: (...args) => item.get(undefined, ...args),
      set: (...args) => item.set(undefined, ...args),
      extend: (...args) => item.set(undefined, ...args),
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
      subscribe: async (key: Key) => {
        const hashedKey = hashPubsubKey(key);
        await this.redisSub.subscribe(hashedKey);

        let asyncIterators: ReturnType<
          typeof callbackToAsyncIterator<Payload>
        >[] = [];

        return {
          listen: ((callback?: (payload: Payload) => void) => {
            const listen = (cb: NonNullable<typeof callback>) => {
              this.redisSub.on("message", (group, payload) => {
                if (hashedKey === group) {
                  cb(JSON.parse(payload));
                }
              });
            };

            if (!callback) {
              const asyncIterator = callbackToAsyncIterator<Payload>(
                async (cb) => {
                  listen(cb);
                },
                {
                  onClose: () => {
                    asyncIterators.splice(
                      asyncIterators.indexOf(asyncIterator),
                      1
                    );
                    this.redisSub.unsubscribe(hashedKey);
                  },
                }
              );
              asyncIterators.push(asyncIterator);
              return asyncIterator;
            }
            listen(callback);
            return undefined;
          }) as any,
          stop: async () => {
            await this.redisSub.unsubscribe(hashedKey);
            await Promise.all(
              asyncIterators.map(async (asyncIterator) => {
                if (asyncIterator.throw) {
                  try {
                    await asyncIterator.throw();
                  } catch (error) {
                    // Ignore error
                  }
                }
              })
            );
            asyncIterators = [];
          },
        };
      },
    };
  }

  getPubsubItemNoKey<Payload>(...itemArgs: any[]): PubsubItemNoKey<Payload> {
    const item = (this.getPubsubItem as any)(...itemArgs);

    return {
      publish: (...args) => item.publish(undefined, ...args),
      subscribe: (...args) => (item.subscribe as any)(undefined, ...args),
    };
  }

  getTaskItem<Key, Payload, Returns>(
    identifier: string,
    hasReturns: Returns extends undefined ? false : true,
    iOptions?: TaskOptions
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
          ...this.defaults?.taskOptions,
          ...iOptions,
          ...options,
        };

        const redisClient = this.redis.duplicate();
        await redisClient.connect();
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
      clear: async (key) => {
        const hashedKey = hashPubsubKey(key);
        await this.redis.del(hashedKey);
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
      clear: (...args) => item.clear(undefined, ...args),
    };
  }
}
