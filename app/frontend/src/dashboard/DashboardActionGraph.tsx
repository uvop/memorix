import { Box, Typography } from "@mui/material";
import ComputerSharpIcon from "@mui/icons-material/ComputerSharp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import {
  useActionGraphQuery,
  useActionGraphOperationsSubscription,
} from "./DashboardActionGraph.generated";
import { DashboardGraphArrows } from "./DashboardGraphArrows";
import { MotionArrowTarget } from "./MotionArrowTarget";
import { Xwrapper } from "react-xarrows";
import { startCase } from "lodash";

export interface DashboardActionGraph {
  actionId: string;
}

export const DashboardActionGraph: React.FC<DashboardActionGraph> = ({
  actionId,
}) => {
  const { data } = useActionGraphQuery({
    variables: { id: actionId },
  });
  const { data: platformOperationsSubscription } =
    useActionGraphOperationsSubscription({
      variables: { id: actionId },
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
          {data?.action.connectedDevices.map((device) => (
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
          {platformOperationsSubscription?.actionLastOperations.map(
            (actionOperation) => (
              <DashboardGraphArrows
                key={actionOperation.id}
                refId={actionId}
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
            <MotionArrowTarget id={data.action.id} textAlign="center">
              <AccountTreeIcon
                key={data.action.id}
                id={data.action.id}
                sx={{
                  fontSize: "48px",
                }}
              />
              <Typography>{startCase(data.action.name)}</Typography>
            </MotionArrowTarget>
          )}
        </Box>
      </Box>
    </Xwrapper>
  );
};
