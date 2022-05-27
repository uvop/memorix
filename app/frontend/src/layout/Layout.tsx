import { Paper } from "@mui/material";
import React from "react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Paper
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        borderRadius: 0,
      }}
    >
      {children}
    </Paper>
  );
};
