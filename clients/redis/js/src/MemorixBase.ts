// eslint-disable-next-line max-classes-per-file
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import callbackToAsyncIterator from "callback-to-async-iterator";
import * as types from "./types";
import { hashKey } from "./utils/hashKey";

export type DefaultOptions = {
  cache?: types.CacheOptions;
  task?: types.TaskOptions;
};

export class MemorixBase {
  protected namespaceNameTree: string[];

  protected defaultOptions?: DefaultOptions;

  private redis: Redis;

  private redisSub: Redis;

  private redisTasks: Redis[];

  private subscriptionCallbacks: Map<string, ((payload: any) => void)[]>;

  constructor({ redisUrl }: { redisUrl: string }, ref?: MemorixBase) {
    if (ref) {
      this.redis = ref.redis;
      this.redisSub = ref.redisSub;
      this.redisTasks = ref.redisTasks;
      this.subscriptionCallbacks = ref.subscriptionCallbacks;
    } else {
      this.redis = new Redis(redisUrl, { lazyConnect: true });
      this.redisSub = this.redis.duplicate();
      this.redisTasks = [];
      this.subscriptionCallbacks = new Map();
    }
  }

  async connect(): Promise<void> {
    await this.redis.connect();
    await this.redisSub.connect();

    this.redisSub.on("message", (group, payload) => {
      const callbacks = this.subscriptionCallbacks.get(group);
      if (!callbacks) {
        return;
      }
      const parsedPayload = JSON.parse(payload);
      callbacks.forEach((cb) => {
        cb(parsedPayload);
      });
    });
  }

  disconnect(): void {
    this.redis.disconnect();
    this.redisSub.disconnect();
    this.redisTasks.forEach((x) => {
      x.disconnect();
    });
  }

  protected getNamespaceItem<T extends MemorixBase>(
    NamespaceClass: new (...arg: ConstructorParameters<typeof MemorixBase>) => T
  ): T {
    return new NamespaceClass({ redisUrl: "unused" }, this);
  }

  protected getCacheItem<Key, Payload>(
    identifier: string,
    iOptions?: types.CacheOptions
  ): types.CacheItem<Key, Payload> {
    const hashCacheKey = (key: Key | undefined) => {
      return hashKey(
        key
          ? [...this.namespaceNameTree, identifier, key]
          : [...this.namespaceNameTree, identifier]
      );
    };

    const cacheItem: types.CacheItem<Key, Payload> = {
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
        await this.redis.set(
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
          ...this.defaultOptions?.cache,
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

  protected getCacheItemNoKey<Payload>(
    ...itemArgs: any[]
  ): types.CacheItemNoKey<Payload> {
    const item = (this.getCacheItem as any)(...itemArgs);

    return {
      get: (...args) => item.get(undefined, ...args),
      set: (...args) => item.set(undefined, ...args),
      extend: (...args) => item.extend(undefined, ...args),
    };
  }

  protected getPubsubItem<Key, Payload>(
    identifier: string
  ): types.PubsubItem<Key, Payload> {
    const hashPubsubKey = (key: Key | undefined) => {
      return hashKey(
        key
          ? [...this.namespaceNameTree, identifier, key]
          : [...this.namespaceNameTree, identifier]
      );
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
      subscribe: async (key: Key, callback?: (payload: Payload) => void) => {
        const hashedKey = hashPubsubKey(key);
        await this.redisSub.subscribe(hashedKey);

        if (!callback) {
          const asyncIterator = callbackToAsyncIterator<
            Payload,
            (payload: Payload) => void
          >(
            async (cb) => {
              this.subscriptionCallbacks.set(hashedKey, [
                ...(this.subscriptionCallbacks.get(hashedKey) ?? []),
                cb,
              ]);
              return cb;
            },
            {
              onClose: (cb) => {
                const callbacks = this.subscriptionCallbacks.get(hashedKey);
                if (!callbacks) {
                  return;
                }
                const callbackIndex = callbacks.indexOf(cb);
                if (callbackIndex === -1) {
                  return;
                }
                this.subscriptionCallbacks.set(
                  hashedKey,
                  callbacks.filter((_, i) => i !== callbackIndex)
                );
              },
            }
          );
          return {
            asyncIterator,
            unsubscribe: async () => {
              await this.redisSub.unsubscribe(hashedKey);
              if (asyncIterator.throw) {
                try {
                  await asyncIterator.throw();
                } catch (error) {
                  // Ignore error
                }
              }
            },
          };
        }
        this.subscriptionCallbacks.set(hashedKey, [
          ...(this.subscriptionCallbacks.get(hashedKey) ?? []),
          callback,
        ]);
        return {
          unsubscribe: async () => {
            await this.redisSub.unsubscribe(hashedKey);
            const callbacks = this.subscriptionCallbacks.get(hashedKey);
            if (!callbacks) {
              return;
            }
            const callbackIndex = callbacks.indexOf(callback);
            if (callbackIndex === -1) {
              return;
            }
            this.subscriptionCallbacks.set(
              hashedKey,
              callbacks.filter((_, i) => i !== callbackIndex)
            );
          },
        } as any;
      },
    };
  }

  protected getPubsubItemNoKey<Payload>(
    ...itemArgs: any[]
  ): types.PubsubItemNoKey<Payload> {
    const item = (this.getPubsubItem as any)(...itemArgs);

    return {
      publish: (...args) => item.publish(undefined, ...args),
      subscribe: (...args) => (item.subscribe as any)(undefined, ...args),
    };
  }

  protected getTaskItem<Key, Payload, Returns>(
    identifier: string,
    hasReturns: Returns extends undefined ? false : true,
    iOptions?: types.TaskOptions
  ): types.TaskItem<Key, Payload, Returns> {
    const hashPubsubKey = (key: Key | undefined) => {
      return hashKey(
        key
          ? [...this.namespaceNameTree, identifier, key]
          : [...this.namespaceNameTree, identifier]
      );
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
                .dequeue(returnsId!, (returns) => {
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
        let key: Key;
        let callback: types.TaskDequeueCallback<Payload, Returns> | undefined;
        let options: types.TaskOptions | undefined;
        if (args.length === 1) {
          [key] = args;
        } else if (typeof args[1] === "function") {
          [key, callback, options] = args;
        } else {
          [key, options] = args;
        }
        const hashedKey = hashPubsubKey(key);
        const { takeNewest = false } = {
          ...this.defaultOptions?.task,
          ...iOptions,
          ...options,
        };

        const redisClient = this.redis.duplicate();
        await redisClient.connect();
        this.redisTasks.push(redisClient);
        let isStopped = false;

        const pop = () =>
          new Promise<{ value?: { payload: Payload; returnsId?: string } }>(
            (res, rej) => {
              redisClient[takeNewest ? "brpop" : "blpop"](
                hashedKey,
                0,
                (err, popValue) => {
                  if (err) {
                    if (isStopped) {
                      res({ value: undefined });
                    } else {
                      rej(err);
                    }
                    return;
                  }
                  if (!popValue) {
                    return;
                  }
                  const [, wrapedPayloadStr] = popValue;
                  const wrapedPayload = JSON.parse(wrapedPayloadStr);
                  const payload: Payload = hasReturns
                    ? wrapedPayload[1]
                    : wrapedPayload[0];

                  if (hasReturns) {
                    const returnsId: string = wrapedPayload[0];
                    res({ value: { payload, returnsId } });
                  } else {
                    res({ value: { payload } });
                  }
                }
              );
            }
          );
        let currentPop: undefined | ReturnType<typeof pop>;

        if (callback === undefined) {
          const asyncIterator: AsyncIterableIterator<{
            payload: Payload;
            returnValue: Returns extends undefined
              ? undefined
              : (value: Returns) => Promise<void>;
          }> = {
            [Symbol.asyncIterator]() {
              return this;
            },
            next: async () => {
              currentPop = pop();
              const { value } = await currentPop;
              if (!value) {
                return {
                  done: true,
                };
              }
              const { payload, returnsId } = value;
              if (hasReturns && returnsId !== undefined) {
                return {
                  value: {
                    payload,
                    returnValue: async (returns) => {
                      await returnTask!.queue(returnsId, returns);
                    },
                  },
                  done: false,
                };
              }
              return {
                value: {
                  payload,
                  returnValue: undefined,
                },
                done: false,
              } as any;
            },
            throw() {
              return Promise.reject(new Error("Thrown"));
            },
          };
          return {
            stop: async () => {
              isStopped = true;
              redisClient.disconnect();
              const indexToRemove = this.redisTasks.indexOf(redisClient);
              if (indexToRemove !== -1) {
                this.redisTasks.splice(indexToRemove, 1);
              }
              await currentPop;
            },
            asyncIterator,
          };
        }
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

              const result = callback!(payload);
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
        } as any;
      },
      clear: async (key) => {
        const hashedKey = hashPubsubKey(key);
        await this.redis.del(hashedKey);
      },
    };
  }

  protected getTaskItemNoKey<Payload, Returns>(
    ...itemArgs: any[]
  ): types.TaskItemNoKey<Payload, Returns> {
    const item = (this.getTaskItem as any)(...itemArgs);

    return {
      queue: (...args) => item.queue(undefined, ...args),
      dequeue: (...args) => item.dequeue(undefined, ...args),
      clear: (...args) => item.clear(undefined, ...args),
    };
  }
}
