import { Box, Typography } from "@mui/material";
import ComputerSharpIcon from "@mui/icons-material/ComputerSharp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import RedisIcon from "src/assets/redis.svg";
import {
  useSchemaGraphQuery,
  useSchemaGraphOperationsSubscription,
} from "./SchemaGraph.generated";
import { SchemaPlatformType } from "src/core/graphql/types.generated";
import { GraphOperationArrows } from "src/core/graphs/GraphOperationArrows";
import { GraphInstance } from "src/core/graphs/GraphInstance";
import { Xwrapper } from "react-xarrows";
import { useRouter } from "next/router";
import { routes } from "pages";
import { useEffect, useState } from "react";
import { useOpenOperationDrawer } from "src/dashboard/OperationDrawer";

export const SchemaGraph = () => {
  const router = useRouter();
  const { data } = useSchemaGraphQuery();
  const { data: schemaOperationsSubscription } =
    useSchemaGraphOperationsSubscription();

  const [didOpen, setDidOpen] = useState(false);
  const openOperationDrawer = useOpenOperationDrawer();

  useEffect(() => {
    if (!didOpen && schemaOperationsSubscription) {
      const operation =
        schemaOperationsSubscription.schemaLastOperations[0].operation;
      if (
        operation.data.__typename !== undefined &&
        (operation.data as any).queueTo?.returnCallbackEndedMsAgo !=
          undefined &&
        operation.actionId === "redis_task_algo"
      ) {
        openOperationDrawer({
          actionId: operation.actionId,
          connectedDeviceId: operation.connectedDeviceId,
          startDate: new Date(Date.now() - operation.createMsAgo),
          type: operation.type,
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
                          Date.now() -
                            operation.data.publishTo.callbackStartedMsAgo
                        ),
                      }
                    : undefined,
                  phase2: operation.data.publishTo?.callbackEndedMsAgo
                    ? {
                        callbackEndedDate: new Date(
                          Date.now() -
                            operation.data.publishTo.callbackEndedMsAgo
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
                        toConnectedDeviceId:
                          operation.data.queueTo.connectedDeviceId,
                        callbackStartedDate: new Date(
                          Date.now() -
                            operation.data.queueTo.callbackStartedMsAgo
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
                          Date.now() -
                            operation.data.queueTo.returnCallbackEndedMsAgo
                        ),
                      }
                    : undefined,
                },
              } as any)
            : {}),
        });
        setDidOpen(true);
      }
    }
  }, [didOpen, openOperationDrawer, schemaOperationsSubscription]);

  return (
    <Xwrapper>
      <Box
        height="100%"
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gridTemplateRows="repeat(1, 1fr)"
        columnGap="10px"
        rowGap="15px"
      >
        <Box
          display="flex"
          flexDirection="column"
          gap="24px"
          alignItems="center"
        >
          {data?.schema.connectedDevices.map((device) => (
            <GraphInstance key={device.id} graphKey="schema" id={device.id}>
              <Box textAlign="center">
                <ComputerSharpIcon
                  id={device.id}
                  sx={{
                    fontSize: "48px",
                  }}
                />
                <Typography>{device.name}</Typography>
              </Box>
            </GraphInstance>
          ))}
          {schemaOperationsSubscription?.schemaLastOperations.map(
            (schemaOperation) => (
              <GraphOperationArrows
                key={schemaOperation.operation.id}
                refId={schemaOperation.platformId}
                operation={schemaOperation.operation}
              />
            )
          )}
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          gap="24px"
          alignItems="center"
        >
          {data?.schema.platforms.map((platform) => {
            switch (platform.type) {
              case SchemaPlatformType.Redis:
                return (
                  <GraphInstance
                    key={platform.id}
                    graphKey="schema"
                    id={platform.id}
                    onClick={(e, isAfterDrag) => {
                      if (!isAfterDrag) {
                        router.push(
                          routes.platforms.platformId(platform.id).PlatformGraph
                        );
                      }
                    }}
                  >
                    <Box textAlign="center">
                      <RedisIcon
                        key={platform.id}
                        width="48px"
                        height="48px"
                        id={platform.id}
                      />
                      <Typography>Redis</Typography>
                    </Box>
                  </GraphInstance>
                );
              default:
                return (
                  <GraphInstance
                    key={platform.id}
                    graphKey="schema"
                    id={platform.id}
                  >
                    <Box textAlign="center">
                      <AccountTreeIcon
                        key={platform.id}
                        id={platform.id}
                        sx={{
                          fontSize: "48px",
                        }}
                      />
                      <Typography>P2P</Typography>
                    </Box>
                  </GraphInstance>
                );
            }
          })}
        </Box>
      </Box>
    </Xwrapper>
  );
};
