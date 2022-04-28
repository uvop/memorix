import { MemorixBaseApi } from "./MemorixBaseApi";
import {
  EventTypes,
  Languages,
  MemorixReportApi,
} from "./report-api.generated";
import { CacheItem, MemorixPayload, PubsubItem } from "./types";

export class MemorixClientApi extends MemorixBaseApi {
  private readonly reporter: MemorixReportApi;

  private deviceIdPromise: Promise<string>;

  constructor(schema: string) {
    super();

    this.reporter = new MemorixReportApi();
    this.reporter.pubsub.registerDevice.publish({
      schema,
      language: Languages.typescript,
    });

    this.deviceIdPromise = Promise.resolve("Test");
  }

  getCacheItem<Key, Payload>(identifier: string): CacheItem<Key, Payload> {
    const cacheItem = super.getCacheItem<any, MemorixPayload<Payload>>(
      identifier
    );

    return {
      get: async (...args) => {
        const memorixPayload = await cacheItem.get(...args);

        this.deviceIdPromise.then((deviceId) => {
          this.reporter.pubsub.sendEvent.publish({
            deviceId,
            traceId: memorixPayload?.traceId ?? "EMPTY_GET",
            type: EventTypes.get,
            data: {
              identifier,
              args,
            },
          });
        });

        return memorixPayload?.payload ?? null;
      },
      set: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const payload = args.length === 1 ? args[0] : args[1];

        const traceId = `${Date.now()}`;

        this.deviceIdPromise.then((deviceId) => {
          this.reporter.pubsub.sendEvent.publish({
            deviceId,
            traceId,
            type: EventTypes.set,
            data: {
              identifier,
              args,
            },
          });
        });

        await cacheItem.set(key, {
          traceId,
          payload,
        });
      },
    };
  }

  getPubsubItem<Key, Payload>(identifier: string): PubsubItem<Key, Payload> {
    const pubsubItem = super.getPubsubItem<any, MemorixPayload<Payload>>(
      identifier
    );

    return {
      subscribe: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const callback = args.length === 1 ? args[0] : args[1];

        // TODO - link this traceId to the callback.
        const traceId = `${Date.now()}`;

        this.deviceIdPromise.then((deviceId) => {
          this.reporter.pubsub.sendEvent.publish({
            deviceId,
            traceId,
            type: EventTypes.set,
            data: {
              identifier,
              args,
            },
          });
        });

        const result = pubsubItem.subscribe(key, (memorixPayload) => {
          this.deviceIdPromise.then((deviceId) => {
            this.reporter.pubsub.sendEventEnd.publish({
              deviceId,
              traceId: memorixPayload.traceId,
              type: EventTypes.subscribe,
            });
          });

          return callback(memorixPayload.payload);
        });

        return result;
      },
      publish: async (...args) => {
        const key = args.length === 1 ? undefined : args[0];
        const payload = args.length === 1 ? args[0] : args[1];

        const traceId = `${Date.now()}`;

        this.deviceIdPromise.then((deviceId) => {
          this.reporter.pubsub.sendEvent.publish({
            deviceId,
            traceId,
            type: EventTypes.set,
            data: {
              identifier,
              args,
            },
          });
        });

        await pubsubItem.publish(key, {
          traceId,
          payload,
        });
      },
    };
  }
}
