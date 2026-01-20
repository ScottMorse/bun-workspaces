export const CONFIG_LOCATION_TYPES = ["jsoncFile", "jsonFile", "packageJson"];

export type ConfigLocationType = (typeof CONFIG_LOCATION_TYPES)[number];

export type ConfigLocation = {
  type: ConfigLocationType;
  content: unknown;
  path: string;
};
