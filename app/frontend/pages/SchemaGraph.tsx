import { Box, Paper, Tab, Tabs, TabsProps } from "@mui/material";
import type { NextPage } from "next";
import React, { useCallback, useState } from "react";
import { SchemaGraph as SchemaGraphPage } from "src/schema/SchemaGraph";
import { OperationDrawer } from "src/dashboard/OperationDrawer";
import { TabPanel } from "src/ui/TabPanel";
import { SchemaTimeline } from "src/schema/SchemaTimeline";

enum TabType {
  Graph,
  Timeline,
}

const SchemaGraph: NextPage = () => {
  const [tab, setTab] = useState(TabType.Graph);
  const handleTabsChange = useCallback<NonNullable<TabsProps["onChange"]>>(
    (e, newTab: TabType) => {
      setTab(newTab);
    },
    []
  );

  return (
    <OperationDrawer>
      <Paper
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <Tabs
          value={tab}
          onChange={handleTabsChange}
          aria-label="basic tabs example"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value={TabType.Graph} label="Graph" />
          <Tab value={TabType.Timeline} label="Timeline" />
        </Tabs>
        <TabPanel
          currentValue={tab}
          value={TabType.Graph}
          sx={{ flex: 1, minHeight: 0 }}
        >
          <SchemaGraphPage />
        </TabPanel>
        <TabPanel
          currentValue={tab}
          value={TabType.Timeline}
          sx={{ flex: 1, minHeight: 0 }}
        >
          <SchemaTimeline />
        </TabPanel>
      </Paper>
    </OperationDrawer>
  );
};

export default SchemaGraph;
