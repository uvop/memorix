import { MemorixBaseApi } from "@memorix/client-js/MemorixBaseApi";

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
    >("registerDevice"),
    deregisterDevice: this.getTaskItem<undefined, string, never>(
      "deregisterDevice"
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
      never
    >("sendEvent"),
    sendEventEnd: this.getTaskItem<
      undefined,
      {
        deviceId: string;
        type: EventTypes;
        traceId: string;
      },
      never
    >("sendEventEnd"),
  };
}
