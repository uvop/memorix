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

export interface ResourceGraph {
  resourceId: string | undefined;
}

export const ResourceGraph: React.FC<ResourceGraph> = ({ resourceId }) => {
  const { data } = useResourceGraphQuery({
    variables: { id: resourceId },
    skip: !resourceId,
  });
  const { data: platformOperationsSubscription } =
    useResourceGraphOperationsSubscription({
      variables: { id: resourceId },
      skip: !resourceId,
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
            <GraphInstance
              key={device.id}
              graphKey={`resource_${resourceId}`}
              id={device.id}
            >
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
