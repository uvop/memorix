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
  task = {
    registerDevice: this.getTaskItem<
      undefined,
      {
        schema: string;
        language: Languages;
      },
      string
    >("registerDevice", true),
    deregisterDevice: this.getTaskItem<undefined, string, undefined>(
      "deregisterDevice",
      false
    ),
    sendEvent: this.getTaskItem<
      undefined,
      {
        deviceId: string;
        type: EventTypes;
        traceId: string;
        data: {
          identifier: string;
          args: any;
        };
      },
      undefined
    >("sendEvent", false),
    sendEventEnd: this.getTaskItem<
      undefined,
      {
        deviceId: string;
        type: EventTypes;
        traceId: string;
      },
      undefined
    >("sendEventEnd", false),
  };
}
