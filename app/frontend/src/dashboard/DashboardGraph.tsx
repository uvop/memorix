import { Box, CircularProgress, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { useGraphDetailsSubscription } from "./DashboardGraph.generated";
import { DashboardGraphNode } from "./DashboardGraphNode";

export const DashboardGraph = () => {
  const { loading, data } = useGraphDetailsSubscription();
  const [secondsElapsedSinceDataFetch, setSecondsElapsedSinceDataFetch] =
    useState(0);

  const gotData = !data || loading;

  useEffect(() => {
    setSecondsElapsedSinceDataFetch(0);
    const timer = setInterval(() => {
      setSecondsElapsedSinceDataFetch((x) => x + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [gotData]);

  if (gotData) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "auto",
          columnGap: "10px",
          rowGap: "15px",
        }}
      >
        {data.connectedDevices.map((cd) => (
          <>
            <Box />
            <DashboardGraphNode
              key={cd.id}
              data={cd}
              addSeconds={secondsElapsedSinceDataFetch}
            />
          </>
        ))}
      </Box>
    </Box>
  );
};
