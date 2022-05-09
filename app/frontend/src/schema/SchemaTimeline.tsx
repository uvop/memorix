import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { TreeView, TreeItem } from "@mui/lab";

export const SchemaTimeline: React.FC = () => {
  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{
        flexGrow: 1,
        maxWidth: 400,
        overflowY: "auto",
      }}
    >
      <TreeItem nodeId="plat1" label="Redis">
        <TreeItem nodeId="plat1_rs1" label="Cache">
          <TreeItem nodeId="plat1_rs1_ac1" label="Cache Action 1"></TreeItem>
        </TreeItem>
        <TreeItem nodeId="plat1_rs2" label="Pubsub">
          <TreeItem nodeId="plat1_rs2_ac1" label="Pubsub Action 1"></TreeItem>
          <TreeItem nodeId="plat1_rs2_ac2" label="Pubsub Action 2"></TreeItem>
        </TreeItem>
        <TreeItem nodeId="plat1_rs3" label="Task">
          <TreeItem nodeId="plat1_rs3_ac1" label="Task Action 1"></TreeItem>
          <TreeItem nodeId="plat1_rs3_ac2" label="Task Action 2"></TreeItem>
          <TreeItem nodeId="plat1_rs3_ac3" label="Task Action 3"></TreeItem>
        </TreeItem>
      </TreeItem>
      <TreeItem nodeId="plat2" label="P2P"></TreeItem>
    </TreeView>
  );
};
