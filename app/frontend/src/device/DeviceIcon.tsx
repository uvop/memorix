/* eslint-disable jsx-a11y/alt-text */
import Image from "next/image";
import IotIcon from "src/assets/iot_icon.png";
import GraphqlIcon from "src/assets/graphql_icon.svg";
import PythonIcon from "src/assets/python_icon.svg";

export interface DeviceIconProps {
  name: string;
}
export const DeviceIcon: React.FC<DeviceIconProps> = ({ name }) => {
  if (name.toLowerCase().startsWith("iot")) {
    return <Image priority src={IotIcon.src} width={48} height={48} />;
  } else if (name.toLowerCase().includes("graph")) {
    return <GraphqlIcon width="48px" height="48px" />;
  } else {
    return <PythonIcon width="48px" height="48px" />;
  }
};
