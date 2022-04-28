export type CacheItem<Key, Payload> = {
  get(...args: Key extends undefined ? [] : [key: Key]): Promise<Payload>;
  set(
    ...args: Key extends undefined
      ? [payload: Payload]
      : [key: Key, payload: Payload]
  ): Promise<void>;
};
