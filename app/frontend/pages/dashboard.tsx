import { Box, Tab, Tabs, TabsProps } from "@mui/material";
import type { NextPage } from "next";
import React, { useCallback, useState } from "react";
import { DashboardSchemaGraph } from "src/dashboard/DashboardSchemaGraph";
import { TabPanel } from "src/ui/TabPanel";

enum TabType {
  Graph,
  Timeline,
}

const Dashboard: NextPage = () => {
  const [tab, setTab] = useState(TabType.Graph);
  const handleTabsChange = useCallback<NonNullable<TabsProps["onChange"]>>(
    (e, newTab: TabType) => {
      setTab(newTab);
    },
    []
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Tabs
        value={tab}
        onChange={handleTabsChange}
        aria-label="basic tabs example"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value={TabType.Graph} label="Graph" />
        <Tab value={TabType.Timeline} label="Timeline" />
      </Tabs>
      <TabPanel currentValue={tab} value={TabType.Graph} sx={{ flex: 1 }}>
        <DashboardSchemaGraph />
      </TabPanel>
      <TabPanel currentValue={tab} value={TabType.Timeline}>
        <DashboardSchemaGraph />
      </TabPanel>
    </Box>
  );
};

export default Dashboard;
