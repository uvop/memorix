import { MemorixBaseApi } from "./MemorixBaseApi";

export enum EventTypes {
  get = "get",
  set = "set",
  publish = "publish",
  subscribe = "subscribe",
  queue = "queue",
  dequeue = "dequeue",
}

export enum Languages {
  typescript = "typescript",
}

export class MemorixReportApi extends MemorixBaseApi {
  pubsub = {
    registerDevice: this.getPubsubItem<
      undefined,
      {
        schema: string;
        language: Languages;
      }
    >("registerDevice"),
    deregisterDevice: this.getPubsubItem<undefined, string>("deregisterDevice"),
    sendEvent: this.getPubsubItem<
      undefined,
      {
        deviceId: string;
        type: EventTypes;
        traceId: string;
        data: {
          identifier: string;
          args: any;
        };
      }
    >("sendEvent"),
    sendEventEnd: this.getPubsubItem<
      undefined,
      {
        deviceId: string;
        type: EventTypes;
        traceId: string;
      }
    >("sendEventEnd"),
  };
}
