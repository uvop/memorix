import { Box } from "@mui/material";
import { motion, useMotionValue } from "framer-motion";
import React, { ComponentProps, MouseEvent } from "react";
import { useXarrow } from "react-xarrows";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { useImmerAtom } from "jotai/immer";
import { useRef } from "react";

const MotionBox = motion(Box);

const dragInfoAtomFamily = atomFamily((identity: string) =>
  atomWithStorage(`GraphInstance_${identity}`, { x: 0, y: 0 })
);

type MotionBoxProps = ComponentProps<typeof MotionBox>;

export interface GraphInstanceProps extends Omit<MotionBoxProps, "onClick"> {
  graphKey: string;
  id: string;
  onClick?: (e: MouseEvent<HTMLDivElement>, isAfterDrag: boolean) => void;
}

export const GraphInstance: React.FC<GraphInstanceProps> = ({
  graphKey,
  id,
  onClick,
  ...boxProps
}) => {
  const isDragRef = useRef(false);
  const dragInfoIdentity = `${graphKey}_${id}`;

  const [dragInfo, updateDragInfo] = useImmerAtom(
    dragInfoAtomFamily(dragInfoIdentity)
  );
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
      whileHover="hover"
      whileDrag="drag"
      variants={{
        hover: {
          cursor: "grab",
        },
        drag: {
          cursor: "grabbing",
        },
      }}
      onDragStart={() => {
        isDragRef.current = true;
        updateXArrow();
      }}
      // @ts-expect-error
      onDragEnd={(e, info) => {
        updateDragInfo((d) => {
          d.x += info.offset.x;
          d.y += info.offset.y;
        });
        updateXArrow();
      }}
      dragMomentum={false}
      onClick={(e) => {
        onClick?.(e, isDragRef.current);
      }}
      onMouseDown={(e) => {
        isDragRef.current = false;
        boxProps.onMouseDown?.(e);
      }}
      border="1px solid"
      borderRadius="12px"
      p={2}
      width="140px"
      display="flex"
      justifyContent="center"
      alignItems="center"
      {...boxProps}
    />
  );
};
