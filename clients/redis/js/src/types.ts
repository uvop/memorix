export type CacheSetOptions = {
  expire?: {
    value: number;
    isInMs?: boolean;
  };
};

export type CacheItem<Key, Payload> = {
  get(key: Key): Promise<Payload | null>;
  set(key: Key, payload: Payload, options?: CacheSetOptions): Promise<void>;
};
export type CacheItemNoKey<Payload> = {
  get(): Promise<Payload | null>;
  set(payload: Payload, options?: CacheSetOptions): Promise<void>;
};

export type PubsubCallback<Payload> = (payload: Payload) => void;

export type PubsubItem<Key, Payload> = {
  subscribe(
    key: Key,
    callback: PubsubCallback<{ payload: Payload }>
  ): Promise<{ stop: () => Promise<void> }>;
  subscribe(key: Key): AsyncIterableIterator<{ payload: Payload }>;
  publish(key: Key, payload: Payload): Promise<{ subscribersSize: number }>;
};
export type PubsubItemNoKey<Payload> = {
  subscribe(
    callback: PubsubCallback<{ payload: Payload }>
  ): Promise<{ stop: () => Promise<void> }>;
  subscribe(): AsyncIterableIterator<{ payload: Payload }>;
  publish(payload: Payload): Promise<{ subscribersSize: number }>;
};

export type TaskDequequeOptions = {
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
      options?: TaskDequequeOptions
    ]
  ): TaskDequeue;
};
export type TaskItemNoKey<Payload, Returns> = {
  queue(...args: [payload: Payload]): TaskQueue<Returns>;
  dequeue(
    ...args: [
      callback: TaskDequeueCallback<Payload, Returns>,
      options?: TaskDequequeOptions
    ]
  ): TaskDequeue;
};
