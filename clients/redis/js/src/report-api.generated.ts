import { MemorixBaseApi } from "./MemorixBaseApi";

export enum Languages {
  typescript = "typescript",
}

export class MemorixReportApi extends MemorixBaseApi {
  task = {
    startSession: this.getTaskItem<undefined, {
      schema: string;
      language: Languages;
      temp: {
        token: string;
      };
    }, {
      sessionId: string;
    }>("startSession"),
    keepSessionAlive: this.getTaskItem<undefined, {
      sessionId: string;
    }, undefined>("keepSessionAlive"),
    stopSession: this.getTaskItem<undefined, {
      sessionId: string;
    }, undefined>("stopSession"),
    collectGet: this.getTaskItem<undefined, {
      identifier: string;
      sessionId: string;
      key?: any;
      setTraceId?: string;
    }, undefined>("collectGet"),
    collectSet: this.getTaskItem<undefined, {
      identifier: string;
      sessionId: string;
      key?: any;
      setTraceId: string;
      payload: any;
    }, undefined>("collectSet"),
    collectSubscribe: this.getTaskItem<undefined, {
      identifier: string;
      sessionId: string;
      key?: any;
    }, {
      subscriptionId: string;
    }>("collectSubscribe"),
    collectPublish: this.getTaskItem<undefined, {
      identifier: string;
      sessionId: string;
      key?: any;
      publishTraceId: string;
      payload?: any;
    }, undefined>("collectPublish"),
    collectSubscribeCallback: this.getTaskItem<undefined, {
      subscriptionId: string;
      publishTraceId: string;
    }, undefined>("collectSubscribeCallback"),
    collectDequeue: this.getTaskItem<undefined, {
      identifier: string;
      sessionId: string;
      key?: any;
    }, {
      dequeueId: string;
    }>("collectDequeue"),
    collectQueue: this.getTaskItem<undefined, {
      identifier: string;
      sessionId: string;
      key?: any;
      queueTraceId: string;
      payload?: any;
    }, {
      queueId: string;
    }>("collectQueue"),
    collectDequeueCallback: this.getTaskItem<undefined, {
      dequeueId: string;
      queueTraceId: string;
      returnPayload?: any;
    }, undefined>("collectDequeueCallback"),
    collectQueueCallback: this.getTaskItem<undefined, {
      queueId: string;
    }, undefined>("collectQueueCallback"),
  };
}
