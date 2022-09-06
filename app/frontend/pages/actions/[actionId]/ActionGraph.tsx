import { Box, Stack, Tab, Tabs, TabsProps } from "@mui/material";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import { ActionGraph as ActionGraphPage } from "src/actions/ActionGraph";
import { LogoIcon } from "src/assets/LogoICon";
import { Layout } from "src/layout/Layout";
import { TabPanel } from "src/ui/TabPanel";

enum TabType {
  Graph,
  Timeline,
}

const ActionGraph: NextPage = () => {
  const router = useRouter();
  const actionId = router.isReady
    ? (router.query.actionId as string)
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
      <Stack flexDirection="row">
        <Box
          sx={{
            mx: 1,
            marginInlineEnd: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoIcon size={16} />
        </Box>
        <Tabs
          value={tab}
          onChange={handleTabsChange}
          aria-label="basic tabs example"
          sx={{ flex: 1 }}
        >
          <Tab value={TabType.Graph} label="Graph" />
          <Tab value={TabType.Timeline} label="Timeline" />
        </Tabs>
      </Stack>
      <TabPanel currentValue={tab} value={TabType.Graph} sx={{ flex: 1 }}>
        <ActionGraphPage actionId={actionId} />
      </TabPanel>
      <TabPanel currentValue={tab} value={TabType.Timeline}>
        <ActionGraphPage actionId={actionId} />
      </TabPanel>
    </Layout>
  );
};

export default ActionGraph;
