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

export type TaskQueueCallback<Returns> = (returns: Returns) => void;
export type TaskDequeueCallback<Payload, Returns> = (
  payload: Payload
) => Returns;

export type TaskItem<Key, Payload, Returns> = {
  queue(
    ...args: Key extends undefined
      ? [payload: Payload]
      : [key: Key, payload: Payload]
  ): Promise<Returns>;
  dequeue(
    ...args: Key extends undefined
      ? [callback: TaskDequeueCallback<Payload, Returns>]
      : [key: Key, callback: TaskDequeueCallback<Payload, Returns>]
  ): Promise<void>;
};
