import {
  ConnectWithoutContact,
  FormatListNumbered,
  Storage,
} from "@mui/icons-material";
import { ActionOperationType } from "src/core/graphql/types.generated";

export const ResourceTypeIcon = ({ type }: { type: ActionOperationType }) => {
  return {
    [ActionOperationType.Cache]: <Storage htmlColor="black" />,
    [ActionOperationType.Pubsub]: <ConnectWithoutContact htmlColor="black" />,
    [ActionOperationType.Task]: <FormatListNumbered htmlColor="black" />,
  }[type];
};
