/* eslint-disable class-methods-use-this */

import { CacheItem, GlobalCacheItem } from "./types";

export class BaseMemorixApi {
  getCacheItem<Payload>(identifier: string): GlobalCacheItem<Payload>;
  getCacheItem<Key, Payload>(identifier: string): CacheItem<Key, Payload>;
  getCacheItem<Key, Payload>(identifier: string): any {
    console.log(identifier);

    return {
      set(...args: [Key, Payload] | [Payload]) {
        const key = args.length === 1 ? undefined : args[0];
        const payload = args.length === 1 ? args[0] : args[1];

        return Promise.resolve();
      },
      get(key?: Key) {
        console.log(key);
        return Promise.resolve();
      },
    };
  }
}
