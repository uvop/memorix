import React from "react";
import { useTheme } from "@mui/material/styles";
import Logo from "./logo.svg";
import LogoNoText from "./logo-no-text.svg";
import LogoJustText from "./logo-just-text.svg";

export const LogoIcon = ({
  format = "regular",
  size,
}: {
  format?: "regular" | "no-text" | "just-text";
  size: number;
}) => {
  const theme = useTheme();
  const Icon = {
    regular: Logo,
    "no-text": LogoNoText,
    "just-text": LogoJustText,
  }[format];
  const width = `${size * 4}px`;
  return (
    <Icon
      style={{
        fill: theme.palette.mode === "dark" ? "#fff" : "#4D4D4D",
        height: "auto",
        width,
      }}
    />
  );
};
