import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { TreeView, TreeItem } from "@mui/lab";
import { Box } from "@mui/system";
import { TimelineBar } from "src/timeline/TimelineBar";
import { Typography } from "@mui/material";
import { useIntervalRender } from "src/core/hooks/useIntervalRender";
import { useConsistentColors } from "src/core/hooks/useConsistentColors";
import { useEffect, useState } from "react";
import { differenceInMinutes } from "date-fns";

export interface Node {
  id: string;
  name: string;
  bars: Array<{ id: string; startDate: Date; endDate?: Date; operation: any }>;
  items?: Node[];
}

export interface TimelineProps {
  startDate: Date;
  nodes: Node[];
}

export const Timeline: React.FC<TimelineProps> = ({ nodes, startDate }) => {
  useIntervalRender(40);
  const endDate = new Date();
  const consistentColor = useConsistentColors();

  const renderNode = (node: Node, parent: string) => {
    return (
      <TreeItem
        key={node.id}
        nodeId={`${parent}.${node.id}`}
        label={
          <Box display="flex" height="30px">
            <Typography fontSize="22px">{node.name}</Typography>
            <Box
              flex={1}
              height="30px"
              display="flex"
              alignItems="center"
              position="relative"
              maxWidth="1060px"
              marginLeft="auto"
              overflow="hidden"
            >
              {node.bars
                .filter((bar) => !bar.endDate || bar.endDate > startDate)
                .map((bar) => (
                  <TimelineBar
                    key={bar.id}
                    operation={bar.operation}
                    bgcolor={consistentColor(bar.id)}
                    timelineStartDate={startDate}
                    timelineEndDate={endDate}
                    startDate={bar.startDate}
                    endDate={bar.endDate ?? endDate}
                  />
                ))}
            </Box>
          </Box>
        }
      >
        {node.items?.map((item) => renderNode(item, node.id))}
      </TreeItem>
    );
  };
  return (
    <Box height="100%" width="100%">
      <TreeView
        aria-label="timeline"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{
          flexGrow: 1,
          maxWidth: "100%",
          overflowY: "auto",
        }}
      >
        {nodes.map((node) => renderNode(node, "root"))}
      </TreeView>
    </Box>
  );
};
