import { Box, Typography } from "@mui/material";
import ComputerSharpIcon from "@mui/icons-material/ComputerSharp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import dynamic from "next/dynamic";
import {
  format as dateFormat,
  startOfDay,
  addMilliseconds,
  differenceInMilliseconds,
} from "date-fns";
import RedisIcon from "src/assets/redis.svg";
import { useState } from "react";
import { useIntervalRender } from "src/core/hooks/useIntervalRender";
const Xarrow = dynamic(() => import("react-xarrows"), { ssr: false });

export const DashboardGraph = () => {
  useIntervalRender(1000);

  const [baseDate] = useState(() => Date.now());

  return (
    <Box
      height="100%"
      display="grid"
      gridTemplateColumns="repeat(3, 1fr)"
      gridTemplateRows="repeat(1, 1fr)"
      columnGap="10px"
      rowGap="15px"
    >
      <Box display="flex" flexDirection="column" gap="24px" alignItems="center">
        <ComputerSharpIcon
          id="platform1"
          sx={{
            fontSize: "48px",
          }}
        />
        <Xarrow
          start="platform1"
          end="redis"
          path="grid"
          showHead={false}
          labels={{
            start: (
              <Typography>
                40ms -{" "}
                {dateFormat(
                  addMilliseconds(
                    startOfDay(Date.now()),
                    differenceInMilliseconds(Date.now(), baseDate) + 7000
                  ),
                  "HH:mm:ss"
                )}
              </Typography>
            ),
          }}
        />
        <ComputerSharpIcon
          id="platform2"
          sx={{
            fontSize: "48px",
          }}
        />
        <Xarrow
          start="platform2"
          end="redis"
          path="grid"
          showHead={false}
          labels={{
            start: (
              <Typography>
                25ms -{" "}
                {dateFormat(
                  addMilliseconds(
                    startOfDay(Date.now()),
                    differenceInMilliseconds(Date.now(), baseDate) + 4000
                  ),
                  "HH:mm:ss"
                )}
              </Typography>
            ),
          }}
        />
        <ComputerSharpIcon
          id="platform3"
          sx={{
            fontSize: "48px",
          }}
        />
        <Xarrow
          start="platform3"
          end="redis"
          path="grid"
          showHead={false}
          labels={{
            start: (
              <Typography>
                37ms -{" "}
                {dateFormat(
                  addMilliseconds(
                    startOfDay(Date.now()),
                    differenceInMilliseconds(Date.now(), baseDate) + 20000
                  ),
                  "HH:mm:ss"
                )}
              </Typography>
            ),
          }}
        />
      </Box>
      <Box display="flex" flexDirection="column" gap="24px" alignItems="center">
        <RedisIcon width="48px" height="48px" id="redis" />
        <AccountTreeIcon
          sx={{
            fontSize: "48px",
          }}
        />
      </Box>
    </Box>
  );
};
