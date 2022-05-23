import { Box, Typography } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import {
  useActionGraphQuery,
  useActionGraphOperationsSubscription,
} from "./ActionGraph.generated";
import { Xwrapper } from "react-xarrows";
import { startCase } from "lodash";
import { GraphInstance } from "src/core/graphs/GraphInstance";
import { GraphOperationArrows } from "src/core/graphs/GraphOperationArrows";
import { useIntervalRender } from "src/core/hooks/useIntervalRender";
import { useState } from "react";
import { differenceInSeconds } from "date-fns";
import { DeviceIcon } from "src/device/DeviceIcon";

export interface ActionGraph {
  actionId: string | undefined;
}

export const ActionGraph: React.FC<ActionGraph> = ({ actionId }) => {
  useIntervalRender(1000);
  const { data } = useActionGraphQuery({
    variables: { id: actionId },
    skip: !actionId,
  });
  const { data: platformOperationsSubscription } =
    useActionGraphOperationsSubscription({
      variables: { id: actionId },
      skip: !actionId,
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
          {data?.action.connectedDevices.map((device) => (
            <GraphInstance
              key={device.id}
              graphKey={`action_${actionId}`}
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
          {platformOperationsSubscription?.actionLastOperations.map(
            (actionOperation) => (
              <GraphOperationArrows
                key={actionOperation.id}
                refId={actionId!}
                operation={actionOperation}
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
          {data?.action && (
            <GraphInstance
              id={data.action.id}
              graphKey={`action_${actionId}`}
              textAlign="center"
            >
              <AccountTreeIcon
                key={data.action.id}
                id={data.action.id}
                sx={{
                  fontSize: "48px",
                }}
              />
              <Typography>{startCase(data.action.name)}</Typography>
            </GraphInstance>
          )}
        </Box>
      </Box>
    </Xwrapper>
  );
};
