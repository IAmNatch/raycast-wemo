import { environment, updateCommandMetadata, LocalStorage } from "@raycast/api";
import { getWemoDevices } from "./utils";

export default async () => {
  await getWemoDevices();
};
