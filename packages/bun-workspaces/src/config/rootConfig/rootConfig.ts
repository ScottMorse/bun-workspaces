import { validate } from "json-schema";
import { type FromSchema, type JSONSchema } from "json-schema-to-ts";
import { defineErrors } from "../../internal/core";
import {
  determineParallelMax,
  resolveScriptShell,
  type ScriptShellOption,
} from "../../runScript";

const JSON_VALIDATION_ERRORS = defineErrors("InvalidJSONType");

export const ROOT_CONFIG_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    additionalProperties: false,
    defaults: {
      type: "object",
      additionalProperties: false,
      properties: {
        parallelMax: {
          type: ["number", "string"],
        },
        shell: {
          type: "string",
        },
      },
    },
  },
} satisfies JSONSchema;

export type RootConfig = FromSchema<typeof ROOT_CONFIG_JSON_SCHEMA>;

export type ResolvedRootConfig = {
  defaults: {
    parallelMax: number;
    shell: ScriptShellOption;
  };
};

export const validateRootConfig = (config: RootConfig) => {
  const result = validate(config, ROOT_CONFIG_JSON_SCHEMA);
  if (!result.valid) {
    throw new JSON_VALIDATION_ERRORS.InvalidJSONType(
      `JSON is invalid:\n${result.errors.map((error) => `  ${error.message}`).join("\n")}`,
    );
  }
  return [];
};

export const createDefaultRootConfig = (): ResolvedRootConfig =>
  resolveRootConfig({});

export const resolveRootConfig = (config: RootConfig): ResolvedRootConfig => {
  validateRootConfig(config);

  return {
    defaults: {
      parallelMax: determineParallelMax(
        config.defaults?.parallelMax ?? "default",
      ),
      shell: resolveScriptShell(config.defaults?.shell),
    },
  };
};
