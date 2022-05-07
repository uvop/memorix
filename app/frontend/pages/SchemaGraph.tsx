import { Box, Tab, Tabs, TabsProps } from "@mui/material";
import type { NextPage } from "next";
import React, { useCallback, useState } from "react";
import { SchemaGraph as SchemaGraphPage } from "src/schema/SchemaGraph";
import { OperationDrawer } from "src/dashboard/OperationDrawer";
import { TabPanel } from "src/ui/TabPanel";

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
          <SchemaGraphPage />
        </TabPanel>
        <TabPanel currentValue={tab} value={TabType.Timeline}>
          <SchemaGraphPage />
        </TabPanel>
      </Box>
    </OperationDrawer>
  );
};

export default SchemaGraph;
