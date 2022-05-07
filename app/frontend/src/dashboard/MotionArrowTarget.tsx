import { Box } from "@mui/material";
import { motion, useMotionValue } from "framer-motion";
import React, { ComponentProps } from "react";
import { useXarrow } from "react-xarrows";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { useImmerAtom } from "jotai/immer";

const MotionBox = motion(Box);

const dragInfoAtomFamily = atomFamily((id: string) =>
  atomWithStorage(`MotionArrowTarget_${id}`, { x: 0, y: 0 })
);

export const MotionArrowTarget: React.FC<
  { id: string } & ComponentProps<typeof MotionBox>
> = ({ id, ...boxProps }) => {
  const [dragInfo, updateDragInfo] = useImmerAtom(dragInfoAtomFamily(id));
  const dragX = useMotionValue(dragInfo.x);
  const dragY = useMotionValue(dragInfo.y);
  const updateXArrow = useXarrow();

  return (
    <MotionBox
      component={motion.div}
      drag
      style={{
        x: dragX,
        y: dragY,
      }}
      onDragStart={updateXArrow}
      // @ts-expect-error
      onDragEnd={(_, info) => {
        updateDragInfo((d) => {
          d.x += info.offset.x;
          d.y += info.offset.y;
        });
        updateXArrow();
      }}
      dragMomentum={false}
      {...boxProps}
    />
  );
};
