/* eslint-disable jsx-a11y/alt-text */
import Image from "next/image";
import IotIcon from "src/assets/iot_icon.png";
import GraphqlIcon from "src/assets/graphql_icon.svg";
import PythonIcon from "src/assets/python_icon.svg";
import TaskIcon from "src/assets/task_icon.svg";
import {
  CacheOperationType,
  PubsubOperationType,
  SchemaResourceType,
  TaskOperationType,
} from "src/core/graphql/types.generated";
import { SdStorageSharp, CellTower, AllInbox } from "@mui/icons-material";

export interface ResourceIconProps {
  type: SchemaResourceType;
}
export const ResourceIcon: React.FC<ResourceIconProps> = ({ type }) => {
  switch (type) {
    case SchemaResourceType.Cache:
      return <SdStorageSharp sx={{ color: "lightblue", fontSize: "48px" }} />;
    case SchemaResourceType.Pubsub:
      return <CellTower sx={{ color: "lightblue", fontSize: "48px" }} />;
    case SchemaResourceType.Task:
      return <AllInbox sx={{ color: "lightblue", fontSize: "48px" }} />;
  }
};
