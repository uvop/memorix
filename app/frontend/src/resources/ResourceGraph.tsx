import { Box, Typography } from "@mui/material";
import ComputerSharpIcon from "@mui/icons-material/ComputerSharp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import {
  useResourceGraphQuery,
  useResourceGraphOperationsSubscription,
} from "./ResourceGraph.generated";
import { Xwrapper } from "react-xarrows";
import { startCase } from "lodash";
import { GraphInstance } from "src/core/graphs/GraphInstance";
import { GraphOperationArrows } from "src/core/graphs/GraphOperationArrows";
import { useRouter } from "next/router";
import { routes } from "pages";
import { useIntervalRender } from "src/core/hooks/useIntervalRender";
import { useState } from "react";
import { differenceInSeconds } from "date-fns";

export interface ResourceGraph {
  resourceId: string | undefined;
}

export const ResourceGraph: React.FC<ResourceGraph> = ({ resourceId }) => {
  useIntervalRender(1000);
  const router = useRouter();
  const { data } = useResourceGraphQuery({
    variables: { id: resourceId },
    skip: !resourceId,
  });
  const { data: platformOperationsSubscription } =
    useResourceGraphOperationsSubscription({
      variables: { id: resourceId },
      skip: !resourceId,
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
          {data?.resource.connectedDevices.map((device) => (
            <GraphInstance
              key={device.id}
              graphKey={`resource_${resourceId}`}
              id={device.id}
            >
              <Box textAlign="center">
                <ComputerSharpIcon
                  id={device.id}
                  sx={{
                    fontSize: "48px",
                  }}
                />
                <Typography>{device.name}</Typography>
                <Typography>
                  {device.secondsConnected + secondsPassed}s alive
                </Typography>
              </Box>
            </GraphInstance>
          ))}
          {platformOperationsSubscription?.resourceLastOperations.map(
            (resourceOperation) => (
              <GraphOperationArrows
                key={resourceOperation.operation.id}
                refId={resourceOperation.actionId}
                operation={resourceOperation.operation}
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
          {data?.resource.actions.map((action) => {
            return (
              <GraphInstance
                key={action.id}
                graphKey={`resource_${resourceId}`}
                id={action.id}
                textAlign="center"
                onClick={(_, isAfterDrag) => {
                  if (!isAfterDrag) {
                    router.push(routes.actions.actionId(action.id).ActionGraph);
                  }
                }}
              >
                <AccountTreeIcon
                  key={action.id}
                  id={action.id}
                  sx={{
                    fontSize: "48px",
                  }}
                />
                <Typography>{startCase(action.name)}</Typography>
              </GraphInstance>
            );
          })}
        </Box>
      </Box>
    </Xwrapper>
  );
};
