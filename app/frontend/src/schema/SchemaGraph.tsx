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

export const SchemaGraph = () => {
  const router = useRouter();
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
            <GraphInstance key={device.id} graphKey="schema" id={device.id}>
              <Box key={device.id} textAlign="center">
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
                    <RedisIcon
                      key={platform.id}
                      width="48px"
                      height="48px"
                      id={platform.id}
                    />
                  </GraphInstance>
                );
              default:
                return (
                  <GraphInstance
                    key={platform.id}
                    graphKey="schema"
                    id={platform.id}
                  >
                    <AccountTreeIcon
                      key={platform.id}
                      id={platform.id}
                      sx={{
                        fontSize: "48px",
                      }}
                    />
                  </GraphInstance>
                );
            }
          })}
        </Box>
      </Box>
    </Xwrapper>
  );
};
