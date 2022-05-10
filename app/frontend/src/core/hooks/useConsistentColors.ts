import { colors } from "@mui/material";
import { size, random, omit } from "lodash";
import { useCallback, useRef } from "react";

export const useConsistentColors = () => {
  const ref = useRef<Record<string, string>>({});

  return useCallback((str: string) => {
    if (!ref.current[str]) {
      const colorsWithoutCommon = omit(colors, "common");
      const colorSchemeKeys = Object.keys(colorsWithoutCommon) as Array<
        keyof typeof colorsWithoutCommon
      >;
      const randColorSchemeIndex = random(
        0,
        size(colorsWithoutCommon) - 1,
        false
      );
      const selectedColorScheme =
        colorsWithoutCommon[colorSchemeKeys[randColorSchemeIndex]];

      const colorKeys = Object.keys(selectedColorScheme) as Array<
        keyof typeof selectedColorScheme
      >;
      const randColorIndex = random(0, size(selectedColorScheme) - 1, false);
      const selectedColor = selectedColorScheme[colorKeys[randColorIndex]];

      ref.current[str] = selectedColor;
    }

    return ref.current[str];
  }, []);
};
