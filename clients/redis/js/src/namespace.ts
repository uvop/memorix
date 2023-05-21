// eslint-disable-next-line max-classes-per-file
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import callbackToAsyncIterator from "callback-to-async-iterator";
import {
  CacheItem,
  CacheOptions,
  TaskOptions,
  PubsubCallback,
  PubsubItem,
  TaskItem,
  CacheItemNoKey,
  PubsubItemNoKey,
  TaskItemNoKey,
} from "./types";
import { hashKey } from "./utils/hashKey";

export type DefaultOptions = {
  cache?: CacheOptions;
  task?: TaskOptions;
};

export type Api = {
  readonly redis: Redis;
  readonly redisSub: Redis;
  redisTasks: Redis[];
};

export class Namespace {
  public static with: (config: {
    name?: string;
    defaultOptions?: DefaultOptions;
  }) => typeof Namespace = (override) =>
    class MemorixNamespaceWith extends Namespace {
      constructor(options) {
        super({
          ...override,
          ...options,
        });
      }
    };

  private readonly api: Api;

  private readonly name?: string;

  private readonly defaultOptions?: DefaultOptions;

  constructor({
    api,
    name,
    defaultOptions,
  }: {
    api: Api;
    name?: string;
    defaultOptions?: DefaultOptions;
  }) {
    this.api = api;
    this.name = name;
    this.defaultOptions = defaultOptions;
  }

  protected getNamespaceItem<T extends Namespace>(
    NamespaceClass: new (param: ConstructorParameters<typeof Namespace>[0]) => T
  ): T {
    return new NamespaceClass({ api: this.api });
  }

  protected getCacheItem<Key, Payload>(
    identifier: string,
    iOptions?: CacheOptions
  ): CacheItem<Key, Payload> {
    const hashCacheKey =
      this.name !== undefined
        ? (key: Key | undefined) => {
            return hashKey(
              key ? [this.name, identifier, key] : [this.name, identifier]
            );
          }
        : (key: Key | undefined) => {
            return hashKey(key ? [identifier, key] : [identifier]);
          };

    const cacheItem: CacheItem<Key, Payload> = {
      set: async (key, payload, options) => {
        const { expire = undefined } = {
          ...this.defaultOptions?.cache,
          ...iOptions,
          ...options,
        };
        const hashedKey = hashCacheKey(key);
        const params = expire
          ? [expire.isInMs ? "PX" : "EX", expire.value.toString()]
          : [];
        await this.api.redis.set(
          hashedKey,
          JSON.stringify(payload),
          ...(params as any)
        );
      },
      get: async (key, options) => {
        const { expire } = {
          ...this.defaultOptions?.cache,
          ...iOptions,
          ...options,
        };
        const hashedKey = hashCacheKey(key);
        const found = await this.api.redis.get(hashedKey);
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
          ...this.defaultOptions?.cache,
          ...iOptions,
        };

        if (!expire) {
          return;
        }

        const hashedKey = hashCacheKey(key);
        if (expire.isInMs) {
          await this.api.redis.pexpire(hashedKey, expire.value);
        } else {
          await this.api.redis.expire(hashedKey, expire.value);
        }
      },
    };
    return cacheItem;
  }

  protected getCacheItemNoKey<Payload>(
    ...itemArgs: any[]
  ): CacheItemNoKey<Payload> {
    const item = (this.getCacheItem as any)(...itemArgs);

    return {
      get: (...args) => item.get(undefined, ...args),
      set: (...args) => item.set(undefined, ...args),
      extend: (...args) => item.set(undefined, ...args),
    };
  }

  protected getPubsubItem<Key, Payload>(
    identifier: string
  ): PubsubItem<Key, Payload> {
    const hashPubsubKey =
      this.name !== undefined
        ? (key: Key | undefined) => {
            return hashKey(
              key ? [this.name, identifier, key] : [this.name, identifier]
            );
          }
        : (key: Key | undefined) => {
            return hashKey(key ? [identifier, key] : [identifier]);
          };

    return {
      publish: async (key, payload) => {
        const hashedKey = hashPubsubKey(key);
        const subscribersSize = await this.api.redis.publish(
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
            this.api.redisSub.subscribe(hashedKey, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({
                  stop: async () => {
                    await this.api.redisSub.unsubscribe(hashedKey);
                  },
                });
              }
            });

            this.api.redisSub.on("message", (group, payload) => {
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

  protected getPubsubItemNoKey<Payload>(
    ...itemArgs: any[]
  ): PubsubItemNoKey<Payload> {
    const item = (this.getPubsubItem as any)(...itemArgs);

    return {
      publish: (...args) => item.publish(undefined, ...args),
      subscribe: (...args) => (item.subscribe as any)(undefined, ...args),
    };
  }

  protected getTaskItem<Key, Payload, Returns>(
    identifier: string,
    hasReturns: Returns extends undefined ? false : true,
    iOptions?: TaskOptions
  ): TaskItem<Key, Payload, Returns> {
    const hashPubsubKey =
      this.name !== undefined
        ? (key: Key | undefined) => {
            return hashKey(
              key ? [this.name, identifier, key] : [this.name, identifier]
            );
          }
        : (key: Key | undefined) => {
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

        const queueSize = await this.api.redis.rpush(
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
          ...this.defaultOptions?.task,
          ...iOptions,
          ...options,
        };

        const redisClient = this.api.redis.duplicate();
        await redisClient.connect();
        this.api.redisTasks.push(redisClient);

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
            const indexToRemove = this.api.redisTasks.indexOf(redisClient);
            if (indexToRemove !== -1) {
              this.api.redisTasks.splice(indexToRemove, 1);
            }
            await stoppedPromise;
          },
        };
      },
      clear: async (key) => {
        const hashedKey = hashPubsubKey(key);
        await this.api.redis.del(hashedKey);
      },
    };
  }

  protected getTaskItemNoKey<Payload, Returns>(
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
