import type { OptionalArray, ResolvedOptionalArray } from "../language";
import type { JSONPrimitiveName, NameToJsonPrimitive } from "./json";

export type JsonPrimitiveValidationConfig = {
  primitive: OptionalArray<JSONPrimitiveName>;
};

export type JsonArrayValidationConfig = {
  item: OptionalArray<JsonItemValidationConfig>;
};

export type JsonItemValidationConfig =
  | JsonPrimitiveValidationConfig
  | JsonObjectValidationConfig
  | JsonArrayValidationConfig;

export type JsonObjectValidationConfig = {
  properties: {
    [key: string]: {
      property: JsonItemValidationConfig;
      optional: boolean;
    };
  };
};

export type JSONValidationConfigToType<
  Config extends JsonItemValidationConfig,
> = Config extends JsonPrimitiveValidationConfig
  ? PrimitiveConfigToPrimitive<Config>
  : Config extends JsonObjectValidationConfig
    ? ObjectConfigToType<Config>
    : Config extends JsonArrayValidationConfig
      ? ArrayConfigToType<Config>
      : never;

type PrimitiveConfigToPrimitive<Config extends JsonPrimitiveValidationConfig> =
  NameToJsonPrimitive<ResolvedOptionalArray<Config["primitive"]>[number]>;

type OptionalObjectConfigKeys<Config extends JsonObjectValidationConfig> = {
  [K in keyof Config["properties"]]: Config["properties"][K] extends {
    optional: true;
  }
    ? K
    : never;
}[keyof Config["properties"]];

type RequiredObjectConfigKeys<Config extends JsonObjectValidationConfig> = {
  [K in keyof Config["properties"]]: Config["properties"][K] extends {
    optional: false;
  }
    ? K
    : never;
}[keyof Config["properties"]];

type ObjectConfigToType<Config extends JsonObjectValidationConfig> = Partial<{
  [K in OptionalObjectConfigKeys<Config>]: JSONValidationConfigToType<
    Config["properties"][K]["property"]
  >;
}> & {
  [K in RequiredObjectConfigKeys<Config>]: JSONValidationConfigToType<
    Config["properties"][K]["property"]
  >;
};

type ArrayConfigToType<Config extends JsonArrayValidationConfig> =
  JSONValidationConfigToType<ResolvedOptionalArray<Config["item"]>[number]>[];
