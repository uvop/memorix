/* eslint-disable class-methods-use-this */

import { CacheItem, GlobalCacheItem } from "./types";

export class BaseMemorixApi {
  getCacheItem<Payload>(identifier: string): GlobalCacheItem<Payload>;
  getCacheItem<Key, Payload>(identifier: string): CacheItem<Key, Payload>;
  getCacheItem(identifier: string) {
    console.log(identifier);

    return {
      set(key, payload) {
        console.log(key, payload);
        return Promise.resolve();
      },
      get(key) {
        console.log(key);
        return Promise.resolve();
      },
    };
  }
}
