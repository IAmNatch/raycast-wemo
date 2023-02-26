import Wemo from "wemo-client";
import { LocalStorage } from "@raycast/api";
import { DeviceInfo } from "./baseTypes";

export const getWemoDevices = async () => {
  const wemo = new Wemo();
  const devices: DeviceInfo[] = [];

  wemo.discover(async (err, deviceInfo: DeviceInfo) => {
    if (
      [Wemo.DEVICE_TYPE.Switch, Wemo.DEVICE_TYPE.LightSwitch, Wemo.DEVICE_TYPE.Dimmer].includes(deviceInfo.deviceType)
    )
      devices.push(deviceInfo);
  });

  await delay(2 * 1000);

  LocalStorage.setItem("devices", JSON.stringify(devices));
  return devices;
};

const delay = (time: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });
