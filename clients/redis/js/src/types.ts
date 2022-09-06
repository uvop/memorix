export type CacheItem<Key, Payload> = {
  get(
    ...args: Key extends undefined ? [] : [key: Key]
  ): Promise<Payload | null>;
  set(
    ...args: Key extends undefined
      ? [payload: Payload]
      : [key: Key, payload: Payload]
  ): Promise<void>;
};

export type PubsubCallback<Payload> = (payload: Payload) => void;

export type PubsubItem<Key, Payload> = {
  subscribe(
    ...args: Key extends undefined
      ? [callback: PubsubCallback<{ payload: Payload }>]
      : [key: Key, callback: PubsubCallback<{ payload: Payload }>]
  ): Promise<{ stop: () => Promise<void> }>;
  publish(
    ...args: Key extends undefined
      ? [payload: Payload]
      : [key: Key, payload: Payload]
  ): Promise<{ subscribersSize: number }>;
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
  queue(
    ...args: Key extends undefined
      ? [payload: Payload]
      : [key: Key, payload: Payload]
  ): TaskQueue<Returns>;
  dequeue(
    ...args: Key extends undefined
      ? [callback: TaskDequeueCallback<Payload, Returns>]
      : [key: Key, callback: TaskDequeueCallback<Payload, Returns>]
  ): TaskDequeue;
};

export type MemorixPayload<Payload> = {
  traceId: string;
  payload: Payload;
};
