import { Box, Typography } from "@mui/material";
import ComputerSharpIcon from "@mui/icons-material/ComputerSharp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import {
  usePlatformGraphQuery,
  usePlatformGraphOperationsSubscription,
} from "./DashboardPlatformGraph.generated";
import { DashboardGraphArrows } from "./DashboardGraphArrows";
import { MotionArrowTarget } from "./MotionArrowTarget";
import { Xwrapper } from "react-xarrows";
import { startCase } from "lodash";

export interface DashboardPlatformGraph {
  platformId: string;
}

export const DashboardPlatformGraph: React.FC<DashboardPlatformGraph> = ({
  platformId,
}) => {
  const { data } = usePlatformGraphQuery({
    variables: { id: platformId },
  });
  const { data: platformOperationsSubscription } =
    usePlatformGraphOperationsSubscription({
      variables: { id: platformId },
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
          {data?.platform.connectedDevices.map((device) => (
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
          {platformOperationsSubscription?.platformLastOperations.map(
            (platformOperation) => (
              <DashboardGraphArrows
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
                  <MotionArrowTarget key={resource.id} id={resource.id}>
                    <AccountTreeIcon
                      key={resource.id}
                      id={resource.id}
                      sx={{
                        fontSize: "48px",
                      }}
                    />
                    <Typography>{startCase(resource.type)}</Typography>
                  </MotionArrowTarget>
                );
            }
          })}
        </Box>
      </Box>
    </Xwrapper>
  );
};
