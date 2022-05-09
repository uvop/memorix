import { createContext, useCallback, useContext, useState } from "react";
import {
  CircularProgress,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  ActionOperation,
  ActionOperationType,
  CacheOperationType,
  PubsubOperationPublishTo,
  PubsubOperationType,
  TaskOperationQueueTo,
  TaskOperationType,
} from "src/core/graphql/types.generated";
import { useActionDataQuery } from "./OperationDrawerAction.generated";
import { Box } from "@mui/system";
import { JSONTree } from "react-json-tree";
import { useBoolean } from "src/core/hooks";
import {
  ConnectWithoutContact as ConnectWithoutContactIcon,
  ExpandLess,
  ExpandMore,
  FormatListNumbered as FormatListNumberedIcon,
  StarBorder,
  Storage as StorageIcon,
} from "@mui/icons-material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { useIntervalRender } from "src/core/hooks/useIntervalRender";
import { ResourceTypeIcon } from "src/assets/ResourceTypeIcon";

export type OperationForDrawer = {
  actionId: string;
  connectedDeviceId: string;
  startDate: Date;
  key?: any;
  payload?: any;
} & (
  | {
      type: ActionOperationType.Cache;
      subType: CacheOperationType;
    }
  | {
      type: ActionOperationType.Pubsub;
      subType: PubsubOperationType;
      data: {
        phase1?: {
          toConnectedDeviceId: string;
          callbackStartedDate: Date;
        };
        phase2?: {
          callbackEndedDate: Date;
        };
      };
    }
  | {
      type: ActionOperationType.Task;
      subType: TaskOperationType;
      data: {
        phase1?: {
          toConnectedDeviceId: string;
          callbackStartedDate: Date;
        };
        phase2?: {
          callbackEndedDate: Date;
          returns?: any;
        };
        phase3?: {
          returnCallbackStartedDate: Date;
        };
        phase4?: {
          returnCallbackEndedDate: Date;
        };
      };
    }
);

const Context = createContext<(operation: OperationForDrawer) => () => void>(
  () => () => {}
);

type Props = {
  children: React.ReactNode;
};

const dateToString = (date: Date) => {
  const ms = Date.now() - date.getTime();
  if (ms < 5000) {
    return `Few seconds ago`;
  }
  if (ms < 120 * 1000) {
    return `${Math.floor(ms / 1000)} seconds ago`;
  }
  if (ms < 60 * 60 * 1000) {
    return `${Math.floor(ms / (60 * 1000))} minutes ago`;
  }
};

export const useOpenOperationDrawer = () => useContext(Context);

export const OperationDrawer = ({ children }: Props) => {
  const [actionOperation, setActionOperation] = useState<
    OperationForDrawer | undefined
  >();
  const { data } = useActionDataQuery({
    variables: {
      id: actionOperation?.actionId!,
    },
    skip: actionOperation === undefined,
  });

  const closeDrawer = useCallback(() => {
    setActionOperation(undefined);
  }, []);

  const handleOpenCallback = useCallback<
    (newActionOperation: OperationForDrawer) => () => void
  >(
    (newActionOperation) => {
      setActionOperation(newActionOperation);
      return closeDrawer;
    },
    [closeDrawer]
  );

  const [detailsOpen, setDetailsOpen] = useBoolean(true);

  useIntervalRender(1000);

  return (
    <>
      <Context.Provider value={handleOpenCallback}>{children}</Context.Provider>
      <Drawer anchor="right" open={!!actionOperation} onClose={closeDrawer}>
        {!data || !actionOperation ? (
          <CircularProgress />
        ) : (
          <List>
            <ListItem>
              <ListItemIcon>
                <ResourceTypeIcon type={actionOperation.type} />
              </ListItemIcon>
              <ListItemText primary={data.action.name} color="primary" />
            </ListItem>
            <ListItemButton onClick={setDetailsOpen.toggle}>
              <ListItemText primary="Details" />
              {detailsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={detailsOpen} timeout="auto">
              <List component="div" disablePadding>
                <ListItem>
                  <Box width={480}>
                    <Timeline>
                      {actionOperation.subType === CacheOperationType.Get && (
                        <TimelineItem>
                          <TimelineSeparator>
                            <TimelineDot />
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent>Get</TimelineContent>
                        </TimelineItem>
                      )}
                      {actionOperation.subType === TaskOperationType.Queue && (
                        <>
                          <TimelineItem>
                            <TimelineContent>
                              Queue from {actionOperation.connectedDeviceId}{" "}
                              {dateToString(actionOperation.startDate)}
                            </TimelineContent>
                            <TimelineSeparator>
                              <TimelineDot />
                              <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineOppositeContent color="text.secondary">
                              <Box textAlign="left">
                                <JSONTree
                                  data={{
                                    key: actionOperation.key,
                                    payload: actionOperation.payload,
                                  }}
                                />
                              </Box>
                            </TimelineOppositeContent>
                          </TimelineItem>
                          {actionOperation.data.phase1 && (
                            <TimelineItem>
                              <TimelineContent>
                                To{" "}
                                {
                                  actionOperation.data.phase1
                                    .toConnectedDeviceId
                                }{" "}
                                {dateToString(
                                  actionOperation.data.phase1
                                    .callbackStartedDate
                                )}
                              </TimelineContent>
                              <TimelineSeparator>
                                <TimelineDot />
                                <TimelineConnector />
                              </TimelineSeparator>
                              <TimelineOppositeContent color="text.secondary" />
                            </TimelineItem>
                          )}
                          {actionOperation.data.phase2 && (
                            <TimelineItem>
                              <TimelineContent>
                                {
                                  actionOperation.data.phase1
                                    ?.toConnectedDeviceId
                                }{" "}
                                returned{" "}
                                {dateToString(
                                  actionOperation.data.phase2.callbackEndedDate
                                )}
                              </TimelineContent>
                              <TimelineSeparator>
                                <TimelineDot />
                                <TimelineConnector />
                              </TimelineSeparator>
                              <TimelineOppositeContent color="text.secondary">
                                <Box textAlign="left">
                                  <JSONTree
                                    data={actionOperation.data.phase2.returns}
                                  />
                                </Box>
                              </TimelineOppositeContent>
                            </TimelineItem>
                          )}
                          {actionOperation.data.phase3 && (
                            <TimelineItem>
                              <TimelineContent>
                                Back to {actionOperation.connectedDeviceId}{" "}
                                started{" "}
                                {dateToString(
                                  actionOperation.data.phase3
                                    .returnCallbackStartedDate
                                )}
                              </TimelineContent>
                              <TimelineSeparator>
                                <TimelineDot />
                                <TimelineConnector />
                              </TimelineSeparator>
                              <TimelineOppositeContent color="text.secondary" />
                            </TimelineItem>
                          )}
                          {actionOperation.data.phase4 && (
                            <TimelineItem>
                              <TimelineContent>
                                Finished{" "}
                                {dateToString(
                                  actionOperation.data.phase4
                                    .returnCallbackEndedDate
                                )}
                              </TimelineContent>
                              <TimelineSeparator>
                                <TimelineDot />
                              </TimelineSeparator>
                              <TimelineOppositeContent color="text.secondary" />
                            </TimelineItem>
                          )}
                        </>
                      )}
                    </Timeline>
                  </Box>
                </ListItem>
              </List>
            </Collapse>
          </List>
        )}
      </Drawer>
    </>
  );
};
