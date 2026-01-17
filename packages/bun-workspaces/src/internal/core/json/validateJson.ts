import { defineErrors, type BunWorkspacesError } from "../error";
import { type OptionalArray, type ResolvedOptionalArray } from "../language";
import { isJSON, isJSONArray, isJSONObject, type JSONPrimitiveName, type NameToJSONPrimitive } from "./json";

export type JSONPrimitiveValidationConfig = {
  primitive: OptionalArray<JSONPrimitiveName>;
};

export type JSONArrayValidationConfig = {
  item: OptionalArray<JSONItemValidationConfig>;
};

export type JSONItemValidationConfig =
  | JSONPrimitiveValidationConfig
  | JSONObjectValidationConfig
  | JSONArrayValidationConfig;

export type JSONObjectValidationConfig = {
  properties: {
    [key: string]: {
      property: JSONItemValidationConfig;
      optional: boolean;
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

type RequiredObjectConfigKeys<Config extends JSONObjectValidationConfig> = {
  [K in keyof Config["properties"]]: Config["properties"][K] extends {
    optional: false;
  }
    ? K
    : never;
}[keyof Config["properties"]];

type ObjectConfigToType<Config extends JSONObjectValidationConfig> = Partial<{
  [K in OptionalObjectConfigKeys<Config>]: JSONValidationConfigToType<
    Config["properties"][K]["property"]
  >;
}> & {
  [K in RequiredObjectConfigKeys<Config>]: JSONValidationConfigToType<
    Config["properties"][K]["property"]
  >;
};

type ArrayConfigToType<Config extends JSONArrayValidationConfig> =
  JSONValidationConfigToType<ResolvedOptionalArray<Config["item"]>[number]>[];

  export const InvalidJSONError = defineErrors("InvalidJSONError").InvalidJSONError;

  export const INVALID_JSON_ERRORS = defineErrors(InvalidJSONError,
    "NotJSONValue",
  )

  const validateJSONObject = <Config extends JSONObjectValidationConfig>(
    value: unknown,
    valueLabel: string,
    config: Config,
  ) => {
    const errors: BunWorkspacesError[] = [];

    return errors
  }

  const validateJSONArray = <Config extends JSONArrayValidationConfig>(
    value: unknown,
    valueLabel: string,
    config: Config,
  ) => {
    const errors: BunWorkspacesError[] = [];

    return errors
  }

  const validateJSONPrimitive = <Config extends JSONPrimitiveValidationConfig>(
    value: unknown,
    valueLabel: string,
    config: Config,
  ) => {
    const errors: BunWorkspacesError[] = [];

    return errors
  }
  
  export const validateJSONShape = <Config extends JSONItemValidationConfig>(
    value: unknown,
    valueLabel: string,
    config: Config,
  ) => {
    const errors: BunWorkspacesError[] = [];
    if(!isJSON(value)){
      errors.push(new INVALID_JSON_ERRORS.NotJSONValue(`Expected ${valueLabel} to be a JSON value: ${value}`));
      return errors;
    }
    
    if(typeof value === "object" && value !== null){
      if(isJSONObject(value)){
        errors.push(...validateJSONObject(value, valueLabel, config));
      } else if(isJSONArray(value)){
        errors.push(...validateJSONArray(value, valueLabel, config));
      } else {
        errors.push(...validateJSONPrimitive(value, valueLabel, config));
      }
    }


    return errors;
  };