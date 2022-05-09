import { Color, Theme } from "@mui/material";
import { BoxProps, ThemeOptions } from "@mui/system";
import { size } from "lodash";
import { useCallback, useRef, useState } from "react";

const colors: BoxProps["bgcolor"][] = [
  "lightblue",
  "lightcoral",
  "lightgray",
  "lightpink",
  "lightgoldenrodyellow",
];

export const useConsistentColors = () => {
  const ref = useRef<Record<string, string>>({});

  return useCallback((str: string) => {
    if (!ref.current[str]) {
      ref.current[str] = colors[size(ref.current) % size(colors)] as string;
    }

    return ref.current[str];
  }, []);
};
