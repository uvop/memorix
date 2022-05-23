import { Box, BoxProps } from "@mui/material";
import { useOpenOperationDrawer } from "src/dashboard/OperationDrawer";

export interface TimelineBarProps extends BoxProps {
  timelineStartDate: Date;
  timelineEndDate: Date;
  startDate: Date;
  operation: any;
  endDate: Date;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  timelineStartDate,
  timelineEndDate,
  startDate,
  operation,
  endDate,
  ...boxProps
}) => {
  const x = timelineEndDate.getTime() - timelineStartDate.getTime();
  const offset = startDate.getTime() - timelineStartDate.getTime();
  const width = endDate.getTime() - startDate.getTime();
  const openOperationDrawer = useOpenOperationDrawer();

  return (
    <Box
      height="20px"
      borderRadius="4px"
      {...boxProps}
      position="absolute"
      onClick={() => {
        openOperationDrawer(operation);
      }}
      left={`${100 * (offset / x)}%`}
      width={`${100 * (width / x)}%`}
    />
  );
};
