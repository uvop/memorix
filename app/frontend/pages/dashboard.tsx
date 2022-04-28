import { Box, Tab, Tabs } from "@mui/material";
import type { NextPage } from "next";
import React, { useCallback, useState } from "react";
import { DashboardGraph } from "src/dashboard/DashboardGraph";
import { DashboardSchema } from "src/dashboard/DashboardSchema";
import { TabPanel } from "src/ui/TabPanel";

enum TabTypes {
  graph,
  schema,
}

const tabsOrder = [
  {
    type: TabTypes.graph,
    name: "Graph",
  },
  {
    type: TabTypes.schema,
    name: "Schema",
  },
];

const Dashboard: NextPage = () => {
  const [tab, setTab] = useState(tabsOrder[0].type);
  const handleTabsChange = useCallback<
    NonNullable<React.ComponentProps<typeof Tabs>["onChange"]>
  >((e, newTab) => {
    setTab(newTab);
  }, []);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={handleTabsChange}
          aria-label="basic tabs example"
        >
          {tabsOrder.map((t) => (
            <Tab key={t.type} label={t.name} />
          ))}
        </Tabs>
      </Box>
      <TabPanel currentValue={tab} value={TabTypes.graph}>
        <DashboardGraph />
      </TabPanel>
      <TabPanel currentValue={tab} value={TabTypes.schema}>
        <DashboardSchema />
      </TabPanel>
    </Box>
  );
};

export default Dashboard;
