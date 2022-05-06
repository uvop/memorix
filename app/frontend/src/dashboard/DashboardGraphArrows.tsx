import dynamic from "next/dynamic";
import {
  ActionOperationType,
  CacheOperation,
  CacheOperationType,
  PubsubOperationType,
  TaskOperationType,
} from "src/graphql/types.generated";
const Xarrow = dynamic(() => import("react-xarrows"), { ssr: false });
import { SchemaGraphOperationsSubscription } from "./DashboardSchemaGraph.generated";

export interface DashboardGraphArrowsProps {
  schemaOperation: SchemaGraphOperationsSubscription["schemaLastOperations"][number];
}

export const DashboardGraphArrows: React.FC<DashboardGraphArrowsProps> = ({
  schemaOperation,
}) => {
  const { operation, platformId } = schemaOperation;
  switch (operation.data.__typename) {
    case "CacheOperation": {
      const { cacheType } = operation.data;
      if (cacheType === CacheOperationType.Get) {
        return (
          <Xarrow
            start={platformId}
            end={operation.connectedDeviceId}
            path="grid"
            labels={{
              start: `Cache Get`,
            }}
          />
        );
      } else {
        return (
          <Xarrow
            start={operation.connectedDeviceId}
            end={platformId}
            path="grid"
            labels={{
              start: `Cache Set`,
            }}
          />
        );
      }
    }
    case "PubsubOperation": {
      const { pubsubType, publishTo } = operation.data;

      if (pubsubType === PubsubOperationType.Subscribe) {
        return (
          <Xarrow
            start={operation.connectedDeviceId}
            end={platformId}
            path="grid"
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
              end={platformId}
              path="grid"
              labels={{
                start: `Pubsub Publish`,
              }}
            />
            {publishTo?.map((x) => (
              <Xarrow
                key={x.connectedDeviceId}
                start={platformId}
                path="grid"
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
      if (taskType === TaskOperationType.Dequeue) {
        return (
          <Xarrow
            start={operation.connectedDeviceId}
            end={platformId}
            path="grid"
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
              end={platformId}
              path="grid"
              labels={{
                start: `Task Publish`,
              }}
            />
            {queueTo && (
              <>
                <Xarrow
                  start={platformId}
                  end={queueTo.connectedDeviceId}
                  path="grid"
                  labels={{
                    start: `Task Subscribtion Callback`,
                  }}
                />
                {queueTo.returns && (
                  <Xarrow
                    start={queueTo.connectedDeviceId}
                    end={platformId}
                    path="grid"
                    labels={{
                      start: `Task Subscribtion Callback Result`,
                    }}
                  />
                )}
                {queueTo.returnCallbackStartedMsAgo && (
                  <Xarrow
                    start={platformId}
                    end={operation.connectedDeviceId}
                    path="grid"
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
