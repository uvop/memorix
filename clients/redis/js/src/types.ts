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
  subscribe(
    key: Key
  ): Promise<{
    stop: () => Promise<void>,
    listen(cb: (payload: Payload) => void): void,
    listen(): AsyncIterableIterator<Payload>,
  }>;
  publish(key: Key, payload: Payload): Promise<{ subscribersSize: number }>;
};
export type PubsubItemNoKey<Payload> = {
  subscribe(): Promise<{
    stop: () => Promise<void>,
    listen(cb: (payload: Payload) => void): void,
    listen(): AsyncIterableIterator<Payload>,
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
type TaskDequeueCallback<Payload, Returns> = (arg: {
  payload: Payload;
}) => Returns extends undefined
  ? void | Promise<void>
  : Returns | Promise<Returns>;

export type TaskItem<Key, Payload, Returns> = {
  queue(...args: [key: Key, payload: Payload]): TaskQueue<Returns>;
  dequeue(
    ...args: [
      key: Key,
      callback: TaskDequeueCallback<Payload, Returns>,
      options?: TaskOptions
    ]
  ): TaskDequeue;
  clear(...args: [key: Key]): void;
};
export type TaskItemNoKey<Payload, Returns> = {
  queue(...args: [payload: Payload]): TaskQueue<Returns>;
  dequeue(
    ...args: [
      callback: TaskDequeueCallback<Payload, Returns>,
      options?: TaskOptions
    ]
  ): TaskDequeue;
  clear(...args: []): void;
};
