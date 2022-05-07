import { Box, Typography } from "@mui/material";
import ComputerSharpIcon from "@mui/icons-material/ComputerSharp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import RedisIcon from "src/assets/redis.svg";
import {
  useSchemaGraphQuery,
  useSchemaGraphOperationsSubscription,
} from "./DashboardSchemaGraph.generated";
import { SchemaPlatformType } from "src/graphql/types.generated";
import { DashboardGraphArrows } from "./DashboardGraphArrows";
import { MotionArrowTarget } from "./MotionArrowTarget";
import { Xwrapper } from "react-xarrows";

export const DashboardSchemaGraph = () => {
  const { data } = useSchemaGraphQuery();
  const { data: schemaOperationsSubscription } =
    useSchemaGraphOperationsSubscription();

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
          {schemaOperationsSubscription?.schemaLastOperations.map(
            (schemaOperation) => (
              <DashboardGraphArrows
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
                  <MotionArrowTarget key={platform.id} id={platform.id}>
                    <RedisIcon
                      key={platform.id}
                      width="48px"
                      height="48px"
                      id={platform.id}
                    />
                  </MotionArrowTarget>
                );
              default:
                return (
                  <MotionArrowTarget key={platform.id} id={platform.id}>
                    <AccountTreeIcon
                      key={platform.id}
                      id={platform.id}
                      sx={{
                        fontSize: "48px",
                      }}
                    />
                  </MotionArrowTarget>
                );
            }
          })}
        </Box>
      </Box>
    </Xwrapper>
  );
};
