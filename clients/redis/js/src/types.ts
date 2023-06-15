export type CacheOptions = {
  expire?: {
    value: number;
    isInMs?: boolean;
    extendOnGet?: boolean;
  };
};

export type CacheItem<Key, Payload> = {
  get(key: Key, options?: CacheOptions): Promise<Payload | null>;
  set(key: Key, payload: Payload, options?: CacheOptions): Promise<void>;
  extend(key: Key): Promise<void>;
};
export type CacheItemNoKey<Payload> = {
  get(options?: CacheOptions): Promise<Payload | null>;
  set(payload: Payload, options?: CacheOptions): Promise<void>;
  extend(): Promise<void>;
};

export type PubsubCallback<Payload> = (payload: Payload) => void;

export type PubsubItem<Key, Payload> = {
  subscribe(key: Key): Promise<{
    asyncIterator: AsyncIterableIterator<Payload>;
    unsubscribe: () => Promise<void>;
  }>;
  subscribe(
    key: Key,
    cb: (payload: Payload) => void
  ): Promise<{
    unsubscribe: () => Promise<void>;
  }>;
  publish(key: Key, payload: Payload): Promise<{ subscribersSize: number }>;
};
export type PubsubItemNoKey<Payload> = {
  subscribe(): Promise<{
    asyncIterator: AsyncIterableIterator<Payload>;
    unsubscribe: () => Promise<void>;
  }>;
  subscribe(cb: (payload: Payload) => void): Promise<{
    unsubscribe: () => Promise<void>;
  }>;
  publish(payload: Payload): Promise<{ subscribersSize: number }>;
};

export type TaskOptions = {
  takeNewest: boolean;
};

type TaskQueue<Returns> = Promise<
  { queueSize: number } & (Returns extends undefined
    ? Record<string, unknown>
    : { getReturns: () => Promise<Returns> })
>;

type TaskDequeue = Promise<{ stop: () => Promise<void> }>;
type TaskDequeueAsyncIterator<Payload, Returns> = Promise<{
  stop: () => Promise<void>;
  asyncIterator: AsyncIterableIterator<{
    payload: Payload;
    returnValue: Returns extends undefined
      ? undefined
      : (value: Returns) => Promise<void>;
  }>;
}>;
export type TaskDequeueCallback<Payload, Returns> = (
  payload: Payload
) => Returns extends undefined
  ? void | Promise<void>
  : Returns | Promise<Returns>;

export type TaskItem<Key, Payload, Returns> = {
  queue(key: Key, payload: Payload): TaskQueue<Returns>;
  dequeue(
    key: Key,
    callback: TaskDequeueCallback<Payload, Returns>,
    options?: TaskOptions
  ): TaskDequeue;
  dequeue(
    key: Key,
    options?: TaskOptions
  ): TaskDequeueAsyncIterator<Payload, Returns>;
  clear(key: Key): void;
};
export type TaskItemNoKey<Payload, Returns> = {
  queue(payload: Payload): TaskQueue<Returns>;
  dequeue(
    callback: TaskDequeueCallback<Payload, Returns>,
    options?: TaskOptions
  ): TaskDequeue;
  dequeue(options?: TaskOptions): TaskDequeueAsyncIterator<Payload, Returns>;
  clear(): void;
};
