export type GlobalCacheItem<Payload> = {
  get(): Promise<Payload>;
  set(payload: Payload): Promise<void>;
};

export type CacheItem<Key, Payload> = {
  get(key: Key): Promise<Payload>;
  set(key: Key, payload: Payload): Promise<void>;
};
