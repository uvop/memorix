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
