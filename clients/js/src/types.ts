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
      ? [callback: PubsubCallback<Payload>]
      : [key: Key, callback: PubsubCallback<Payload>]
  ): Promise<void>;
  publish(
    ...args: Key extends undefined
      ? [payload: Payload]
      : [key: Key, payload: Payload]
  ): Promise<void>;
};

export type TaskDequeueCallback<Returns> = (returns: Returns) => void;
export type TaskQueueCallback<Payload, Returns> = (payload: Payload) => Returns;

export type TaskItem<Key, Payload, Returns> = {
  queue(
    ...args: Key extends undefined
      ? [payload: Payload, callback: TaskDequeueCallback<Returns>]
      : [key: Key, payload: Payload, callback: TaskDequeueCallback<Returns>]
  ): Promise<void>;
  dequeue(
    ...args: Key extends undefined
      ? [callback: TaskQueueCallback<Payload, Returns>]
      : [key: Key, callback: TaskQueueCallback<Payload, Returns>]
  ): Promise<void>;
};
