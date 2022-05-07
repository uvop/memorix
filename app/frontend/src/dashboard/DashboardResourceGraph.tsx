import { Box, Typography } from "@mui/material";
import ComputerSharpIcon from "@mui/icons-material/ComputerSharp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import {
  useResourceGraphQuery,
  useResourceGraphOperationsSubscription,
} from "./DashboardResourceGraph.generated";
import { DashboardGraphArrows } from "./DashboardGraphArrows";
import { MotionArrowTarget } from "./MotionArrowTarget";
import { Xwrapper } from "react-xarrows";
import { startCase } from "lodash";

export interface DashboardResourceGraph {
  resourceId: string;
}

export const DashboardResourceGraph: React.FC<DashboardResourceGraph> = ({
  resourceId,
}) => {
  const { data } = useResourceGraphQuery({
    variables: { id: resourceId },
  });
  const { data: platformOperationsSubscription } =
    useResourceGraphOperationsSubscription({
      variables: { id: resourceId },
    });

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
            <MotionArrowTarget key={device.id} id={device.id}>
              <Box key={device.id} textAlign="center">
                <ComputerSharpIcon
                  id={device.id}
                  sx={{
                    fontSize: "48px",
                  }}
                />
                <Typography>{device.name}</Typography>
              </Box>
            </MotionArrowTarget>
          ))}
          {platformOperationsSubscription?.resourceLastOperations.map(
            (resourceOperation) => (
              <DashboardGraphArrows
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
              <MotionArrowTarget
                key={action.id}
                id={action.id}
                textAlign="center"
              >
                <AccountTreeIcon
                  key={action.id}
                  id={action.id}
                  sx={{
                    fontSize: "48px",
                  }}
                />
                <Typography>{startCase(action.name)}</Typography>
              </MotionArrowTarget>
            );
          })}
        </Box>
      </Box>
    </Xwrapper>
  );
};
