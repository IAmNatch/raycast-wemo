import { Action, ActionPanel, Icon, List, LocalStorage } from "@raycast/api";
import React, { useEffect, Dispatch, SetStateAction } from "react";
import Wemo from "wemo-client";
import { DeviceInfo } from "./baseTypes";
import { getWemoDevices } from "./utils";

// Todo -- Fix binaryState imple

const loadDevices = async (setDevices: Dispatch<DeviceInfo[]>, setIsLoading: Dispatch<boolean>) => {
  setIsLoading(true);
  const deviceJSON = (await LocalStorage.getItem("devices")) as string | undefined;
  if (deviceJSON) {
    const deviceList = JSON.parse(deviceJSON) as DeviceInfo[];
    setDevices(deviceList.sort((a, b) => (a.friendlyName < b.friendlyName ? -1 : 1)));
  }

  // Lazily refresh
  const fresh = await getWemoDevices();
  setDevices(fresh.sort((a, b) => (a.friendlyName < b.friendlyName ? -1 : 1)));
  setIsLoading(false);
};

const setDevice = async (wemo: InstanceType<typeof Wemo>, item: DeviceInfo) => {
  const client = wemo.client(item);

  const binaryState = await new Promise((resolve, reject) => {
    client.getBinaryState((err, binaryState) => {
      if (err) {
        return reject(err);
      }
      resolve(binaryState);
    });
  });

  await new Promise((resolve, reject) => {
    client.setBinaryState(binaryState === "0" ? 1 : 0, (err, binaryState) => {
      if (err) {
        return reject(err);
      }
      resolve(binaryState);
    });
  });
};

const setBrightness = async (
  direction: number,
  wemo: InstanceType<typeof Wemo>,
  item: DeviceInfo,
  setDevices: Dispatch<SetStateAction<DeviceInfo[]>>
) => {
  const client = wemo.client(item);

  const brightness: number = await new Promise((resolve, reject) => {
    client.getBrightness((err, brightness) => {
      if (err || !brightness) {
        return reject(err);
      }

      resolve(brightness);
    });
  });

  const newBrightness =
    direction > 0 ? (brightness + 10 > 100 ? 100 : brightness + 10) : brightness - 10 < 0 ? 0 : brightness - 10;

  await new Promise((resolve, reject) => {
    client.setBrightness(newBrightness, (err, binaryState) => {
      if (err) {
        return reject(err);
      }

      setDevices((devices) =>
        devices.reduce<DeviceInfo[]>((acc, device) => {
          if (device.macAddress === item.macAddress) {
            return [...acc, { ...device, brightness: newBrightness }];
          } else {
            return [...acc, device];
          }
        }, [])
      );
      resolve(binaryState);
    });
  });
};

const WemoComponent = () => {
  const [devices, setDevices] = React.useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  useEffect(() => {
    loadDevices(setDevices, setIsLoading);
  }, []);

  const wemo = new Wemo();

  return (
    <List isLoading={isLoading}>
      <List.Item
        title={"Reload Devices"}
        actions={
          <ActionPanel>
            <Action title="Reload Devices" onAction={async () => await loadDevices(setDevices, setIsLoading)} />
          </ActionPanel>
        }
      />
      <List.Section title="Devices">
        {devices.length !== 0 &&
          devices.map((item) => (
            <List.Item
              accessories={[
                {
                  text: item.brightness ? item.brightness + "%" : undefined,
                },
                { icon: item.binaryState === "1" ? Icon.LightBulb : Icon.LightBulbOff },
              ]}
              key={item.friendlyName}
              title={item.friendlyName}
              actions={
                <ActionPanel>
                  <Action
                    title="Toggle Device"
                    onAction={async () => {
                      await setDevice(wemo, item);
                    }}
                  />
                  {item.deviceType === Wemo.DEVICE_TYPE.Dimmer && (
                    <>
                      <Action
                        shortcut={{ modifiers: ["cmd"], key: "=" }}
                        title="Increase Brightness"
                        onAction={async () => await setBrightness(1, wemo, item, setDevices)}
                      ></Action>
                      <Action
                        shortcut={{ modifiers: ["cmd"], key: "-" }}
                        title="Decrease Brightness"
                        onAction={async () => await setBrightness(-1, wemo, item, setDevices)}
                      ></Action>
                    </>
                  )}
                </ActionPanel>
              }
            ></List.Item>
          ))}
      </List.Section>
      {!isLoading && devices.length === 0 && <List.EmptyView title="No Devices Found" />}
    </List>
  );
};

export default () => {
  // const wemo = new Wemo();

  // useEffect(() => {
  //   loadDevices(setDevices);
  // }, []);

  return (
    <WemoComponent />
    //   <List
    //   filtering={false}
    //   // onSearchTextChange={setSearchText}
    //   navigationTitle="Search Beers"
    //   searchBarPlaceholder="Search your favorite beer"
    // >

    //   {/* {devices && devices.map((item) => (
    //     <List.Item
    //       key={item.friendlyName}
    //       title={item.friendlyName}

    //       // actions={
    //       //   <ActionPanel>
    //       //     <Action title="Select" onAction={() => console.log(`${item} selected`)} />
    //       //   </ActionPanel>
    //       // }
    //     />
    //   ))}
    // </List>) */}
  );
};
