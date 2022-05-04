import { Box, Typography } from "@mui/material";

type Props = {
  children?: React.ReactNode;
  value: number | string;
  currentValue: number | string;
};

export const TabPanel = ({
  children,
  currentValue,
  value,
  ...other
}: Props) => {
  return (
    <div
      role="tabpanel"
      hidden={currentValue !== value}
      aria-labelledby={`simple-tab-${value}`}
      {...other}
    >
      {currentValue === value && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};
