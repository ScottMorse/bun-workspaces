import { type FromSchema, type JSONSchema } from "json-schema-to-ts";
import _validate from "../../internal/generated/ajv/validateRootConfig";
import {
  determineParallelMax,
  resolveScriptShell,
  type ScriptShellOption,
} from "../../runScript";
import type { AjvSchemaValidator } from "../util/ajvTypes";
import { ROOT_CONFIG_ERRORS } from "./errors";

const validate = _validate as unknown as AjvSchemaValidator<RootConfig>;

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
  const isValid = validate(config);
  if (!isValid) {
    const multipleErrors = (validate.errors?.length ?? 0) > 1;
    throw new ROOT_CONFIG_ERRORS.InvalidRootConfig(
      `Root config is invalid:${multipleErrors ? "\n" : ""}${validate.errors
        ?.map(
          (error) =>
            `${multipleErrors ? "  " : " "}config${
              error.instancePath
                ?.replaceAll(/\/(\d+)$/, "[$1]")
                .replaceAll(/^\//, ".") ?? ""
            } ${error.message}`,
        )
        .join("\n")}`,
    );
  }
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
