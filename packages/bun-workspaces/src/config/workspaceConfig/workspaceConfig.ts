import type { BunWorkspacesError } from "../../internal/error";
import { isJsonObject } from "../../internal/json";
import {
  resolveOptionalArray,
  type OptionalArray,
} from "../../internal/optionalArray";
import { WORKSPACE_CONFIG_ERRORS } from "./errors";

export interface ScriptConfig {
  order?: number;
}

export interface WorkspaceConfig {
  alias?: OptionalArray<string>;
  /** The default configuration for scripts in the workspace */
  scriptDefaults?: ScriptConfig;
  /** The configuration for specific scripts in the workspace */
  scripts?: Record<string, ScriptConfig>;
}

export interface ResolvedWorkspaceConfig {
  aliases: string[];
  scriptDefaults: ScriptConfig;
  scripts: Record<string, ScriptConfig>;
}

const validateScriptConfig = (value: unknown, keyName: string) => {
  if (!isJsonObject(value)) {
    return new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig(
      `"${keyName}" in workspace config must be an object`,
    );
  }
  if ("order" in value && typeof value.order !== "number") {
    return new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig(
      `The "order" value in workspace config ${keyName} must be a number`,
    );
  }
  return null;
};

const VALIDATIONS = {
  alias: (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item !== "string") {
          return new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig(
            `Workspace config alias must be a a string or array of strings`,
          );
        }
      }
      return null;
    } else if (typeof value !== "string") {
      return new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig(
        `Workspace config alias must be a string or array of strings`,
      );
    }
    return null;
  },
  scriptDefaults: (value: unknown) =>
    validateScriptConfig(value, '"scriptDefaults"'),
  scripts: (value: unknown) => {
    if (!isJsonObject(value)) {
      return new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig(
        `Workspace config "scripts" must be an object`,
      );
    }
    for (const [key, val] of Object.entries(value as object)) {
      const error = validateScriptConfig(val, `"${key}" in "scripts"`);
      if (error) return error;
    }
    return null;
  },
} as const satisfies Record<
  keyof WorkspaceConfig,
  (value: unknown) => BunWorkspacesError | null
>;

export const validateWorkspaceConfig = (config: WorkspaceConfig) => {
  if (!isJsonObject(config)) {
    return [
      new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig(
        `Workspace config must be an object`,
      ),
    ];
  }

  const errors: BunWorkspacesError[] = [];
  for (const [key, value] of Object.entries(config)) {
    const error = VALIDATIONS[key as keyof WorkspaceConfig](value);
    if (error) errors.push(error);
  }

  return errors;
};

export const resolveWorkspaceConfig = (
  config: WorkspaceConfig,
): ResolvedWorkspaceConfig => {
  return {
    aliases: resolveOptionalArray(config.alias ?? []),
    scriptDefaults: config.scriptDefaults ?? {},
    scripts: config.scripts ?? {},
  };
};

export const createWorkspaceConfig = (
  config?: WorkspaceConfig,
): ResolvedWorkspaceConfig => resolveWorkspaceConfig(config ?? {});
