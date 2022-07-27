import dynamic from "next/dynamic";
import * as Types from "src/core/graphql/types.generated";
const Xarrow = dynamic(() => import("react-xarrows"), { ssr: false });

export interface GraphOperationArrowsProps {
  refId: string;
  operation: {
    connectedDeviceId: string;
    data:
      | ({
          __typename?: "CacheOperation";
        } & { cacheType: Types.CacheOperation["type"] })
      | ({ __typename?: "PubsubOperation" } & {
          pubsubType: Types.PubsubOperation["type"];
        } & {
          publishTo?: Types.Maybe<
            Array<
              { __typename?: "PubsubOperationPublishTo" } & Pick<
                Types.PubsubOperationPublishTo,
                "connectedDeviceId"
              >
            >
          >;
        })
      | ({ __typename?: "TaskOperation" } & {
          taskType: Types.TaskOperation["type"];
        } & {
          queueTo?: Types.Maybe<
            { __typename?: "TaskOperationQueueTo" } & Pick<
              Types.TaskOperationQueueTo,
              "connectedDeviceId" | "returns" | "returnCallbackStartedMsAgo"
            >
          >;
        });
  };
}

export const GraphOperationArrows: React.FC<GraphOperationArrowsProps> = ({
  refId,
  operation,
}) => {
  switch (operation.data.__typename) {
    case "CacheOperation": {
      const { cacheType } = operation.data;
      if (cacheType === Types.CacheOperationType.Get) {
        return (
          <Xarrow
            start={refId}
            end={operation.connectedDeviceId}
            path="smooth"
            labels={{
              start: `Cache Get`,
            }}
          />
        );
      } else {
        return (
          <Xarrow
            start={operation.connectedDeviceId}
            end={refId}
            path="smooth"
            labels={{
              start: `Cache Set`,
            }}
          />
        );
      }
    }
    case "PubsubOperation": {
      const { pubsubType, publishTo } = operation.data;

      if (pubsubType === Types.PubsubOperationType.Subscribe) {
        return (
          <Xarrow
            start={operation.connectedDeviceId}
            end={refId}
            path="smooth"
            labels={{
              start: `Pubsub Subscribe`,
            }}
          />
        );
      } else {
        return (
          <>
            <Xarrow
              start={operation.connectedDeviceId}
              end={refId}
              path="smooth"
              labels={{
                start: `Pubsub Publish`,
              }}
            />
            {publishTo?.map((x) => (
              <Xarrow
                key={x.connectedDeviceId}
                start={refId}
                path="smooth"
                end={x.connectedDeviceId}
                labels={{
                  start: `Subscribe Callback`,
                }}
              />
            ))}
          </>
        );
      }
    }
    case "TaskOperation": {
      const { taskType, queueTo } = operation.data;
      if (taskType === Types.TaskOperationType.Dequeue) {
        return (
          <Xarrow
            start={operation.connectedDeviceId}
            end={refId}
            path="smooth"
            labels={{
              start: `Task Subscribe`,
            }}
          />
        );
      } else {
        return (
          <>
            <Xarrow
              start={operation.connectedDeviceId}
              end={refId}
              path="smooth"
              labels={{
                start: `Task Publish`,
              }}
            />
            {queueTo && (
              <>
                <Xarrow
                  start={refId}
                  end={queueTo.connectedDeviceId}
                  path="smooth"
                  labels={{
                    start: `Task Subscribtion Callback`,
                  }}
                />
                {queueTo.returns && (
                  <Xarrow
                    start={queueTo.connectedDeviceId}
                    end={refId}
                    path="smooth"
                    labels={{
                      start: `Task Subscribtion Callback Result`,
                    }}
                  />
                )}
                {queueTo.returnCallbackStartedMsAgo && (
                  <Xarrow
                    start={refId}
                    end={operation.connectedDeviceId}
                    path="smooth"
                    labels={{
                      start: `Task Result Callback`,
                    }}
                  />
                )}
              </>
            )}
          </>
        );
      }
    }
  }
  return null;
};
