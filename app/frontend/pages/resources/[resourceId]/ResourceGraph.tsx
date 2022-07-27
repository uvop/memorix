import { Box, Tab, Tabs, TabsProps } from "@mui/material";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import { Layout } from "src/layout/Layout";
import { ResourceGraph as ResourceGraphPage } from "src/resources/ResourceGraph";
import { TabPanel } from "src/ui/TabPanel";

enum TabType {
  Graph,
  Timeline,
}

const ResourceGraph: NextPage = () => {
  const router = useRouter();
  const resourceId = router.isReady
    ? (router.query.resourceId as string)
    : undefined;

  const [tab, setTab] = useState(TabType.Graph);
  const handleTabsChange = useCallback<NonNullable<TabsProps["onChange"]>>(
    (e, newTab: TabType) => {
      setTab(newTab);
    },
    []
  );

  return (
    <Layout>
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
        <ResourceGraphPage resourceId={resourceId} />
      </TabPanel>
      <TabPanel currentValue={tab} value={TabType.Timeline}>
        <ResourceGraphPage resourceId={resourceId} />
      </TabPanel>
    </Layout>
  );
};

export default ResourceGraph;
