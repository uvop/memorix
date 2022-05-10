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
import { useEffect, useState, useRef, useMemo } from "react";
import { ActionOperationType } from "src/core/graphql/types.generated";
import produce from "immer";
import { Node, Timeline } from "src/timeline/Timeline";
import { find, flatten, isEmpty, orderBy, startCase } from "lodash";
import { max, subMinutes } from "date-fns";

export const SchemaTimeline: React.FC = () => {
  const { data: timelineQuery } = useSchemaTimelineQuery();
  const { data: operationsSubscription } =
    useSchemaTimelineOperationsSubscription();

  const schemaActions = useMemo(
    () =>
      timelineQuery?.schema.platforms
        .map((p) => p.resources.map((x) => x.actions).flat())
        .flat(),
    [timelineQuery]
  );

  const [minDate, setMinDate] = useState(new Date());
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

  const nodes = useMemo<Node[]>(() => {
    return [
      {
        id: "schema",
        name: "Schema",
        bars: [],
        items: timelineQuery?.schema.platforms.map((platform) => ({
          id: platform.id,
          name: startCase(platform.type),
          bars: [],
          items: platform.resources.map<Node>((resource) => ({
            id: resource.id,
            name: startCase(resource.type),
            bars: [],
            items: resource.actions.map((action) => ({
              id: action.id,
              name: action.name,
              bars: [],
              items: action.connectedDevices.map<Node>((device) => ({
                id: device.id,
                name: device.name,
                bars: actions
                  .filter(
                    ({ actionId, connectedDeviceId }) =>
                      actionId === action.id && connectedDeviceId === device.id
                  )
                  .map((action) => ({
                    id: action.id,
                    startDate: action.startDate,
                    endDate: action.endDate,
                  })),
              })),
            })),
          })),
        })),
      },
    ];
  }, [timelineQuery, actions]);

  useEffect(() => {
    if (
      schemaActions &&
      operationsSubscription &&
      !isEmpty(operationsSubscription?.schemaOperations)
    ) {
      const { schemaOperations } = operationsSubscription;

      setMinDate((minDate) => {
        return (
          minDate ??
          new Date(
            Date.now() -
              orderBy(
                schemaOperations,
                (x) => x.operation.createMsAgo,
                "desc"
              )[0].operation.createMsAgo
          )
        );
      });

      setActions(
        produce((d) => {
          schemaOperations.forEach((operation) => {
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
              formatedOperation.endDate = new Date(Date.now() + 1000);
              d.push(formatedOperation);
              return;
            }
            if (
              operation.operation.data.__typename === "TaskOperation" &&
              operation.operation.data.queueTo?.returnCallbackEndedMsAgo
            ) {
              formatedOperation.endDate = new Date(
                Date.now() -
                  operation.operation.data.queueTo.returnCallbackEndedMsAgo
              );
            }
            if (
              operation.operation.data.__typename === "TaskOperation" &&
              operation.operation.data.queueTo?.callbackEndedMsAgo != null &&
              find(schemaActions, { id: actionId })!.returns == undefined
            ) {
              formatedOperation.endDate = new Date(
                Date.now() - operation.operation.data.queueTo.callbackEndedMsAgo
              );
            }
            if (
              operation.operation.data.__typename === "PubsubOperation" &&
              operation.operation.data.publishTo.callbackEndedMsAgo
            ) {
              const endDate = new Date(
                Date.now() -
                  operation.operation.data.publishTo.callbackEndedMsAgo
              );
              formatedOperation.endDate = endDate;
            }
            let oldOperationsIndex = d.findIndex((x) => x.id === id);
            if (oldOperationsIndex > -1) {
              d.splice(oldOperationsIndex, 1);
            }
            d.push(formatedOperation);
          });
        })
      );
    }
  }, [operationsSubscription, schemaActions]);

  //   console.log(nodes);
  return (
    <Timeline
      startDate={max([minDate, subMinutes(Date.now(), 1)])}
      nodes={nodes}
    />
  );
};
