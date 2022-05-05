import { Box, BoxProps } from "@mui/material";

type Props = BoxProps & {
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
    <Box
      role="tabpanel"
      hidden={currentValue !== value}
      aria-labelledby={`simple-tab-${value}`}
      {...other}
    >
      {currentValue === value && (
        <Box sx={{ p: 3, height: "100%" }}>{children}</Box>
      )}
    </Box>
  );
};
