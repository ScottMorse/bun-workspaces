import type {
  OptionalArray,
  ResolvedOptionalArray,
  Simplify,
} from "../language";
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
    [key: string]: JsonItemValidationConfig;
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

type ObjectConfigToType<Config extends JsonObjectValidationConfig> = Simplify<{
  [K in keyof Config["properties"]]: JSONValidationConfigToType<
    Config["properties"][K]
  >;
}>;

type ArrayConfigToType<Config extends JsonArrayValidationConfig> =
  JSONValidationConfigToType<ResolvedOptionalArray<Config["item"]>[number]>[];
