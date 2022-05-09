import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { TreeView, TreeItem } from "@mui/lab";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Box } from "@mui/system";
import {
  useSchemaTimelineOperationsSubscription,
  useSchemaTimelineQuery,
} from "./SchemaTimeline.generated";
import { useEffect, useState, useRef } from "react";
import { ActionOperationType } from "src/core/graphql/types.generated";

const barData = [
  {
    name: "",
    time: 2400,
  },
  {
    name: "",
    time: 3000,
  },
  {
    name: "",
    time: [150, 2000],
  },
  {
    name: "",
    time: [2000, 2780],
  },
];

export const SchemaTimeline: React.FC = () => {
  const { data, loading } = useSchemaTimelineOperationsSubscription();
  const [actions, setActions] = useState<
    {
      id: string;
      actionId: string;
      connectedDeviceId: string;
      startDate: Date;
      endDate?: Date;
      type: ActionOperationType;
    }[]
  >([]);

  useEffect(() => {
    if (data?.schemaOperations) {
      const actionsCopy = [...actions];
      data.schemaOperations.forEach((operation) => {
        const { actionId, id, connectedDeviceId, createMsAgo, type } =
          operation.operation;
        const startDate = new Date(Date.now() - createMsAgo);
        const formatedOperation = {
          id,
          actionId,
          connectedDeviceId,
          type,
          startDate,
          endDate: undefined as Date | undefined,
        };
        if (type === ActionOperationType.Cache) {
          formatedOperation.endDate = new Date();
          actionsCopy.push(formatedOperation);
          return;
        }
        if (
          operation.operation.data.__typename === "TaskOperation" &&
          operation.operation.data.queueTo?.returnCallbackEndedMsAgo
        ) {
          const endDate = new Date(
            Date.now() -
              operation.operation.data.queueTo?.returnCallbackEndedMsAgo
          );
          formatedOperation.endDate = endDate;
        }
        if (
          operation.operation.data.__typename === "PubsubOperation" &&
          operation.operation.data.publishTo.callbackEndedMsAgo
        ) {
          const endDate = new Date(
            Date.now() - operation.operation.data.publishTo.callbackEndedMsAgo
          );
          formatedOperation.endDate = endDate;
        }
        let oldOperationsIndex = actionsCopy.findIndex(
          (x) => x.actionId === actionId
        );
        if (oldOperationsIndex > -1) {
          actionsCopy.splice(oldOperationsIndex, 1);
        }
        actionsCopy.push(formatedOperation);
      });

      setActions(actionsCopy);
    }
  }, [data]);

  console.log(actions);

  const onBarClick = (bar: Bar) => {
    console.log(bar);
  };

  return (
    <Box display={"flex"} height="100%">
      <TreeView
        aria-label="file system navigator"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{
          flexGrow: 1,
          maxWidth: 400,
          overflowY: "auto",
        }}
      >
        <TreeItem nodeId="plat1" label="Redis">
          <TreeItem nodeId="plat1_rs1" label="Cache">
            <TreeItem nodeId="plat1_rs1_ac1" label="Cache Action 1"></TreeItem>
          </TreeItem>
          <TreeItem nodeId="plat1_rs2" label="Pubsub">
            <TreeItem nodeId="plat1_rs2_ac1" label="Pubsub Action 1"></TreeItem>
            <TreeItem nodeId="plat1_rs2_ac2" label="Pubsub Action 2"></TreeItem>
          </TreeItem>
          <TreeItem nodeId="plat1_rs3" label="Task">
            <TreeItem nodeId="plat1_rs3_ac1" label="Task Action 1"></TreeItem>
            <TreeItem nodeId="plat1_rs3_ac2" label="Task Action 2"></TreeItem>
            <TreeItem nodeId="plat1_rs3_ac3" label="Task Action 3"></TreeItem>
          </TreeItem>
        </TreeItem>
        <TreeItem nodeId="plat2" label="P2P"></TreeItem>
      </TreeView>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          // barCategoryGap={"130px"}
          // barGap={"10px"}

          width={600}
          height={300}
          data={barData}
          style={{
            flex: 1,
          }}
          layout="vertical"
          // margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            padding={{ left: 1, right: 1 }}
            type="number"
            domain={[0, 7000]}
          />
          <YAxis
            type="category"
            dataKey="name"
            hide={true}
            padding={{ top: 1, bottom: 1 }}
          />
          {/* <CartesianGrid strokeDasharray="3 3" /> */}
          <Tooltip />
          <Bar
            dataKey="time"
            fill="#8884d8"
            onClick={onBarClick}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
