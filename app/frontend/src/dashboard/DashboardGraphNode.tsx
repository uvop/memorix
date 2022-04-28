import { Box, Grid, Tooltip, Typography } from "@mui/material";
import { blue } from "@mui/material/colors";
import Image from "next/image";
import { ConnectedDevice, Language } from "src/graphql/types.generated";

type Props = {
  data: ConnectedDevice;
  addSeconds: number;
};

export const DashboardGraphNode = ({ data, addSeconds }: Props) => {
  return (
    <Box
      sx={{
        justifySelf: "center",
        alignSelf: "center",
        display: "inline-flex",
        flexDirection: "column",
        borderRadius: "50%",
        borderColor: blue[600],
        borderWidth: 4,
        borderStyle: "solid",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: 192,
        height: 192,
      }}
    >
      {data.language === Language.Typescript && (
        <Image
          alt="TypeScript logo"
          src="/typescript-logo.svg"
          height={64}
          width={64}
        />
      )}
      <Tooltip title="Seconds connected">
        <Typography>{data.secondsConnected + addSeconds}</Typography>
      </Tooltip>
    </Box>
  );
};
