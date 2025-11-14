import type { BunWorkspacesError } from "../../internal/error";
import { isJsonObject } from "../../internal/json";
import {
  resolveOptionalArray,
  type OptionalArray,
} from "../../internal/optionalArray";
import { WORKSPACE_CONFIG_ERRORS } from "./errors";

export interface WorkspaceConfig {
  alias?: OptionalArray<string>;
}

export interface ResolvedWorkspaceConfig {
  aliases: string[];
}

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
  };
};
