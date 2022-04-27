import { BaseReportApi } from "./BaseReportApi";

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

export class MemorixApi extends BaseReportApi {
  task = {
    registerDevice: this.getTaskItem<never, {
      schema: string;
      language: Languages;
    }, string>("registerDevice"),
    deregisterDevice: this.getTaskItem<never, string, never>("deregisterDevice"),
    sendEvent: this.getTaskItem<never, {
      deviceId: string;
      type: EventTypes;
      traceId: string;
      data: {
        identifier: string;
        args: any;
      };
    }, never>("sendEvent"),
    sendEventEnd: this.getTaskItem<never, {
      deviceId: string;
      type: EventTypes;
      traceId: string;
    }, never>("sendEventEnd"),
  };
}
