import { type FromSchema, type JSONSchema } from "json-schema-to-ts";
import { resolveOptionalArray } from "../../internal/core";
import _validate from "../../internal/generated/ajv/validateWorkspaceConfig";
import type { AjvSchemaValidator } from "../util/ajvTypes";
import { WORKSPACE_CONFIG_ERRORS } from "./errors";

const validate = _validate as unknown as AjvSchemaValidator<WorkspaceConfig>;

export const WORKSPACE_CONFIG_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    alias: {
      type: ["string", "array"],
      items: { type: "string" },
      uniqueItems: true,
    },
    scripts: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          order: {
            type: "number",
          },
        },
        additionalProperties: false,
      },
    },
  },
} satisfies JSONSchema;

/**
 * @todo json-schema-to-ts doesn't support the union type for alias as it is,
 * but AJV error messaging for oneOf is not good
 */
export type WorkspaceConfig = Omit<
  FromSchema<typeof WORKSPACE_CONFIG_JSON_SCHEMA>,
  "alias"
> & {
  alias?: string | string[];
};

export type ResolvedWorkspaceConfig = {
  aliases: string[];
  scripts: Record<string, ScriptConfig>;
};

export type ScriptConfig = NonNullable<WorkspaceConfig["scripts"]>[string];

export const validateWorkspaceConfig = (config: WorkspaceConfig) => {
  const isValid = validate(config);
  if (!isValid) {
    const multipleErrors = (validate.errors?.length ?? 0) > 1;
    throw new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig(
      `Workspace config is invalid:${multipleErrors ? "\n" : ""}${validate.errors
        ?.map(
          (error) =>
            `${multipleErrors ? "  " : " "}config${
              error.instancePath
                ?.replace(/\/(\d+)$/, "[$1]")
                .replace(/^\//, ".") ?? ""
            } ${error.message}`,
        )
        .join("\n")}`,
    );
  }
};

export const resolveWorkspaceConfig = (
  config: WorkspaceConfig,
): ResolvedWorkspaceConfig => {
  validateWorkspaceConfig(config);
  return {
    aliases: resolveOptionalArray(config.alias ?? []),
    scripts: config.scripts ?? {},
  };
};

export const createDefaultWorkspaceConfig = (): ResolvedWorkspaceConfig =>
  resolveWorkspaceConfig({});
