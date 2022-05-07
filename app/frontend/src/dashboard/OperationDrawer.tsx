import { createContext, useCallback, useContext, useState } from "react";
import { CircularProgress, Drawer, Typography } from "@mui/material";
import { ActionOperation } from "src/core/graphql/types.generated";
import { useActionDataQuery } from "./OperationDrawerAction.generated";
import { Box } from "@mui/system";
import { JSONTree } from "react-json-tree";

const Context = createContext<(operation: ActionOperation) => () => void>(
  () => () => {}
);

type Props = {
  children: React.ReactNode;
};

export const useOpenOperationDrawer = () => useContext(Context);

export const OperationDrawer = ({ children }: Props) => {
  const [actionOperation, setActionOperation] = useState<
    ActionOperation | undefined
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
    (newActionOperation: ActionOperation) => () => void
  >(
    (newActionOperation) => {
      setActionOperation(newActionOperation);
      return closeDrawer;
    },
    [closeDrawer]
  );

  return (
    <>
      <Context.Provider value={handleOpenCallback}>{children}</Context.Provider>
      <Drawer anchor="right" open={!!actionOperation} onClose={closeDrawer}>
        {!data || !actionOperation ? (
          <CircularProgress />
        ) : (
          <Box>
            <Typography>name: {data.action.name}</Typography>
            {actionOperation.data.__typename
              ? {
                  CacheOperation: 123,
                  PubsubOperation: 123,
                  TaskOperation: (
                    <>
                      {data.action.key && (
                        <>
                          <Typography>key:</Typography>
                          <JSONTree data={actionOperation.data.key} />
                        </>
                      )}
                      {actionOperation.data.payload && (
                        <>
                          <Typography>
                            payload (published {actionOperation.createMsAgo}ms
                            ago):
                          </Typography>
                          <JSONTree data={actionOperation.data.payload} />
                        </>
                      )}
                      {data.action.returns &&
                        actionOperation.data.__typename === "TaskOperation" &&
                        actionOperation.data.queueTo && (
                          <>
                            <Typography>
                              return (sent{" "}
                              {actionOperation.data.queueTo.callbackEndedMsAgo}
                              ms ago
                              {actionOperation.data.queueTo
                                .returnCallbackStartedMsAgo != undefined
                                ? `, received ${actionOperation.data.queueTo.returnCallbackStartedMsAgo}ms ago`
                                : ""}
                              ):
                            </Typography>
                            <JSONTree
                              data={actionOperation.data.queueTo.returns}
                            />
                          </>
                        )}
                    </>
                  ),
                }[actionOperation.data.__typename]
              : null}
          </Box>
        )}
      </Drawer>
    </>
  );
};
