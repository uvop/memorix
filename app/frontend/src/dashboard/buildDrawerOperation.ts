import { OperationForDrawer } from "./OperationDrawer";

export const buildDrawerOperation = (operation: any): OperationForDrawer => {
  return {
    actionId: operation.actionId,
    connectedDeviceId: operation.connectedDeviceId,
    startDate: new Date(Date.now() - operation.createMsAgo),
    type: operation.type,
    endDate: operation.endDate,
    data: {},
    ...(operation.data.__typename === "CacheOperation"
      ? {
          subType: operation.data.cacheType,
          key: operation.data.cacheKey,
          payload: operation.data.cachePayload,
        }
      : {}),
    ...(operation.data.__typename === "PubsubOperation"
      ? {
          subType: operation.data.pubsubType,
          key: operation.data.pubsubKey,
          payload: operation.data.pubsubPayload,
          data: {
            phase1: operation.data.publishTo
              ? {
                  toConnectedDeviceId:
                    operation.data.publishTo.connectedDeviceId,
                  callbackStartedDate: new Date(
                    Date.now() - operation.data.publishTo.callbackStartedMsAgo
                  ),
                }
              : undefined,
            phase2: operation.data.publishTo?.callbackEndedMsAgo
              ? {
                  callbackEndedDate: new Date(
                    Date.now() - operation.data.publishTo.callbackEndedMsAgo
                  ),
                }
              : undefined,
          },
        }
      : {}),
    ...(operation.data.__typename === "TaskOperation"
      ? ({
          subType: operation.data.taskType,
          key: operation.data.taskKey,
          payload: operation.data.taskPayload,
          data: {
            phase1: operation.data.queueTo
              ? {
                  toConnectedDeviceId: operation.data.queueTo.connectedDeviceId,
                  callbackStartedDate: new Date(
                    Date.now() - operation.data.queueTo.callbackStartedMsAgo
                  ),
                }
              : undefined,
            phase2: operation.data.queueTo?.callbackEndedMsAgo
              ? {
                  callbackEndedDate: new Date(
                    Date.now() - operation.data.queueTo.callbackEndedMsAgo
                  ),
                  returns: operation.data.queueTo.returns,
                }
              : undefined,
            phase3: operation.data.queueTo?.returnCallbackStartedMsAgo
              ? {
                  returnCallbackStartedDate: new Date(
                    Date.now() -
                      operation.data.queueTo.returnCallbackStartedMsAgo
                  ),
                }
              : undefined,
            phase4: operation.data.queueTo?.returnCallbackEndedMsAgo
              ? {
                  returnCallbackEndedDate: new Date(
                    Date.now() - operation.data.queueTo.returnCallbackEndedMsAgo
                  ),
                }
              : undefined,
          },
        } as any)
      : {}),
  };
};
