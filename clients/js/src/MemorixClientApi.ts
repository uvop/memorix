import { MemorixBaseApi } from "./MemorixBaseApi";
import { CacheItem, PubsubItem } from "./types";

export class MemorixClientApi extends MemorixBaseApi {
  getCacheItem<Key, Payload>(identifier: string): CacheItem<Key, Payload> {
    const cacheItem = super.getCacheItem<Key, Payload>(identifier);

    return cacheItem;
  }

  getPubsubItem<Key, Payload>(identifier: string): PubsubItem<Key, Payload> {
    const pubsubItem = super.getPubsubItem<Key, Payload>(identifier);

    return {
      publish: async (...args) => {
        const result = pubsubItem.publish(...args);

        // Use reporter Api

        return result;
      },
      subscribe: async (...args) => {
        const result = pubsubItem.subscribe(...args);

        // Use reporter Api

        return result;
      },
    };
  }
}
