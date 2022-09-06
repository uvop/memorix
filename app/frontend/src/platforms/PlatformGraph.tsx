import { Box, Typography } from "@mui/material";
import {
  usePlatformGraphQuery,
  usePlatformGraphOperationsSubscription,
} from "./PlatformGraph.generated";
import { Xwrapper } from "react-xarrows";
import { startCase } from "lodash";
import { GraphInstance } from "src/core/graphs/GraphInstance";
import { GraphOperationArrows } from "src/core/graphs/GraphOperationArrows";
import { useRouter } from "next/router";
import { routes } from "pages";
import { useIntervalRender } from "src/core/hooks/useIntervalRender";
import { useState } from "react";
import { differenceInSeconds } from "date-fns";
import { DeviceIcon } from "src/device/DeviceIcon";
import { ResourceIcon } from "src/resources/ResourceIcon";

export interface PlatformGraph {
  platformId: string | undefined;
}

export const PlatformGraph: React.FC<PlatformGraph> = ({ platformId }) => {
  useIntervalRender(1000);
  const router = useRouter();

  const { data } = usePlatformGraphQuery({
    variables: { id: platformId! },
    skip: !platformId,
  });

  const { data: platformOperationsSubscription } =
    usePlatformGraphOperationsSubscription({
      variables: { id: platformId! },
      skip: !platformId,
    });
  const [baseDate] = useState(() => new Date());
  const secondsPassed = differenceInSeconds(new Date(), baseDate);

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
          {data?.platform.connectedDevices.map((device) => (
            <GraphInstance
              key={device.id}
              graphKey={`platform_${platformId}`}
              id={device.id}
            >
              <Box textAlign="center">
                <div id={device.id}>
                  <DeviceIcon name={device.name} />
                </div>
                <Typography>{device.name}</Typography>
                <Typography>
                  {device.secondsConnected + secondsPassed}s alive
                </Typography>
              </Box>
            </GraphInstance>
          ))}
          {platformOperationsSubscription?.platformLastOperations.map(
            (platformOperation) => (
              <GraphOperationArrows
                key={platformOperation.operation.id}
                refId={platformOperation.resourceId}
                operation={platformOperation.operation}
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
          {data?.platform.resources.map((resource) => {
            switch (resource.type) {
              default:
                return (
                  <GraphInstance
                    key={resource.id}
                    graphKey={`platform_${platformId}`}
                    id={resource.id}
                    onClick={(_, isAfterDrag) => {
                      if (!isAfterDrag) {
                        router.push(
                          routes.resources.resourceId(resource.id).ResourceGraph
                        );
                      }
                    }}
                  >
                    <div id={resource.id}>
                      <ResourceIcon type={resource.type} />
                    </div>
                    <Typography>{startCase(resource.type)}</Typography>
                  </GraphInstance>
                );
            }
          })}
        </Box>
      </Box>
    </Xwrapper>
  );
};