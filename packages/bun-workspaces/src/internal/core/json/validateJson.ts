import { defineErrors, type BunWorkspacesError } from "../error";
import {
  resolveOptionalArray,
  validateJSType,
  type JSDataTypeofName,
  type OptionalArray,
  type ResolvedOptionalArray,
  type Simplify,
} from "../language";
import {
  isJSON,
  isJSONArray,
  isJSONObject,
  type JSONPrimitiveName,
  type NameToJSONPrimitive,
} from "./json";

export type JSONPrimitiveValidationConfig = {
  primitive: OptionalArray<JSONPrimitiveName>;
};

export type JSONArrayValidationConfig = {
  item: JSONItemValidationConfig;
};

export type JSONItemValidationConfig =
  | JSONPrimitiveValidationConfig
  | JSONObjectValidationConfig
  | JSONArrayValidationConfig;

export type JSONObjectValidationConfig = {
  properties: {
    [key: string]: {
      type: JSONItemValidationConfig;
      optional?: boolean;
    };
  };
};

export type JSONValidationConfigToType<
  Config extends JSONItemValidationConfig,
> = Config extends JSONPrimitiveValidationConfig
  ? PrimitiveConfigToPrimitive<Config>
  : Config extends JSONObjectValidationConfig
    ? ObjectConfigToType<Config>
    : Config extends JSONArrayValidationConfig
      ? ArrayConfigToType<Config>
      : never;

type PrimitiveConfigToPrimitive<Config extends JSONPrimitiveValidationConfig> =
  NameToJSONPrimitive<ResolvedOptionalArray<Config["primitive"]>[number]>;

type OptionalObjectConfigKeys<Config extends JSONObjectValidationConfig> = {
  [K in keyof Config["properties"]]: Config["properties"][K] extends {
    optional: true;
  }
    ? K
    : never;
}[keyof Config["properties"]];

type RequiredObjectConfigKeys<Config extends JSONObjectValidationConfig> =
  Exclude<keyof Config["properties"], OptionalObjectConfigKeys<Config>>;

type ObjectConfigToType<Config extends JSONObjectValidationConfig> = Simplify<
  Partial<{
    [K in OptionalObjectConfigKeys<Config>]: JSONValidationConfigToType<
      Config["properties"][K]["type"]
    >;
  }> & {
    [K in RequiredObjectConfigKeys<Config>]: JSONValidationConfigToType<
      Config["properties"][K]["type"]
    >;
  }
>;

type ArrayConfigToType<Config extends JSONArrayValidationConfig> =
  JSONValidationConfigToType<ResolvedOptionalArray<Config["item"]>[number]>[];

export const InvalidJSONError =
  defineErrors("InvalidJSONError").InvalidJSONError;

export const INVALID_JSON_ERRORS = defineErrors(
  InvalidJSONError,
  "NotJSONValue",
  "JSONObjectMissingProperty",
  "JSONObjectUnexpectedProperty",
  "NotJSONObject",
  "NotJSONArray",
  "NotJSONPrimitive",
);

const validateJSONObject = <Config extends JSONObjectValidationConfig>(
  value: object,
  valueLabel: string,
  config: Config,
) => {
  const errors: BunWorkspacesError[] = [];

  if (!isJSONObject(value)) {
    return [
      new INVALID_JSON_ERRORS.NotJSONObject(
        `Expected ${valueLabel} to be a JSON object. Received: ${Array.isArray(value) ? "array" : value}`,
      ),
    ];
  }

  for (const [key, val] of Object.entries(value)) {
    if (!(key in config.properties)) {
      errors.push(
        new INVALID_JSON_ERRORS.JSONObjectUnexpectedProperty(
          `Object ${valueLabel} has unexpected property: ${key}`,
        ),
      );
    } else {
      const error = validateJSONShape(
        val,
        `${valueLabel}.${key}`,
        config.properties[key].type,
      );
      if (error) errors.push(...error);
    }
  }

  for (const [key, val] of Object.entries(config.properties)) {
    if (!(key in value) && !val.optional) {
      errors.push(
        new INVALID_JSON_ERRORS.JSONObjectMissingProperty(
          `Expected ${valueLabel} to have property: ${key}`,
        ),
      );
    }
  }

  return errors;
};

const validateJSONArray = <Config extends JSONArrayValidationConfig>(
  value: Array<unknown>,
  valueLabel: string,
  config: Config,
) => {
  const errors: BunWorkspacesError[] = [];

  if (!isJSONArray(value)) {
    return [
      new INVALID_JSON_ERRORS.NotJSONArray(
        `Expected ${valueLabel} to be a JSON array: ${value}`,
      ),
    ];
  }

  for (const [index, val] of value.entries()) {
    const error = validateJSONShape(
      val,
      `${valueLabel}[${index}]`,
      config.item,
    );
    if (error) errors.push(...error);
  }

  return errors;
};

const validateJSONPrimitive = <Config extends JSONPrimitiveValidationConfig>(
  value: unknown,
  valueLabel: string,
  config: Config,
) => {
  const errors: BunWorkspacesError[] = [];

  const types = resolveOptionalArray(config.primitive) as (
    | JSDataTypeofName
    | "null"
  )[];

  if (types.includes("null") && value === null) {
    return errors;
  }
  const typeError = validateJSType(value, types as JSDataTypeofName[], {
    valueLabel,
  });

  if (typeError)
    errors.push(
      new INVALID_JSON_ERRORS.NotJSONPrimitive(
        `Expected ${valueLabel} to be of type ${types.join(" | ")}. Received: ${value}`,
      ),
    );

  return errors;
};

export const validateJSONShape = <Config extends JSONItemValidationConfig>(
  value: unknown,
  valueLabel: string,
  config: Config,
) => {
  const errors: BunWorkspacesError[] = [];
  if (!isJSON(value)) {
    errors.push(
      new INVALID_JSON_ERRORS.NotJSONValue(
        `Expected ${valueLabel} to be a JSON value: ${value}`,
      ),
    );
    return errors;
  }

  if ("properties" in config) {
    errors.push(...validateJSONObject(value as object, valueLabel, config));
  } else if (isJSONArray(value) && "item" in config) {
    errors.push(...validateJSONArray(value, valueLabel, config));
  } else if ("primitive" in config) {
    errors.push(...validateJSONPrimitive(value, valueLabel, config));
  }
  return errors;
};
