import { Box, Tab, Tabs, TabsProps } from "@mui/material";
import type { NextPage } from "next";
import React, { useCallback, useState } from "react";
import { DashboardGraph } from "src/dashboard/DashboardGraph";
import { DashboardSchema } from "src/dashboard/DashboardSchema";
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
        <DashboardGraph />
      </TabPanel>
      <TabPanel currentValue={tab} value={TabType.Timeline}>
        <DashboardSchema />
      </TabPanel>
    </Box>
  );
};

export default Dashboard;
