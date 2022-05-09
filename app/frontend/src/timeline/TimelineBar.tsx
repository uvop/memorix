import { Box, BoxProps } from "@mui/material";

export interface TimelineBarProps extends BoxProps {
  timelineStartDate: Date;
  timelineEndDate: Date;
  startDate: Date;
  endDate: Date;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  timelineStartDate,
  timelineEndDate,
  startDate,
  endDate,
  ...boxProps
}) => {
  const x = timelineEndDate.getTime() - timelineStartDate.getTime();
  const offset = startDate.getTime() - timelineStartDate.getTime();
  const width = endDate.getTime() - startDate.getTime();

  return (
    <Box
      height="20px"
      borderRadius="4px"
      {...boxProps}
      position="absolute"
      left={`${100 * (offset / x)}%`}
      width={`${100 * (width / x)}%`}
    />
  );
};
