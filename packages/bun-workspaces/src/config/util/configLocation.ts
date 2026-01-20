export const CONFIG_LOCATION_TYPES = ["jsoncFile", "jsonFile", "packageJson"];

export type ConfigLocationType = (typeof CONFIG_LOCATION_TYPES)[number];

export type ConfigLocation = {
  type: ConfigLocationType;
  content: unknown;
  path: string;
};

const CONFIG_LOCATION_PATHS: Record<
  ConfigLocationType,
  (name: string) => string
> = {
  jsoncFile: (name) => `${name}.jsonc`,
  jsonFile: (name) => `${name}.json`,
  packageJson: (name) => `package.json["${name}"]`,
};

export const createConfigLocationPath = (
  locationType: ConfigLocationType,
  name: string,
) => CONFIG_LOCATION_PATHS[locationType](name);
