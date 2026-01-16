import { isJsonObject, type BunWorkspacesError } from "../../internal/core";
import type { ShellOption } from "../../project";
import {
  determineParallelMax,
  resolveScriptShell,
  validateScriptShellOption,
} from "../../runScript";
import { getUserEnvVar } from "../userEnvVars";
import { ROOT_CONFIG_ERRORS } from "./errors";

export type RootConfigDefaults = {
  parallelMax?: number;
  shell?: ShellOption;
};

export type RootConfig = {
  defaults?: RootConfigDefaults;
  includeRootWorkspace?: boolean;
};

export type ResolvedRootConfig = {
  defaults: Required<RootConfigDefaults>;
  includeRootWorkspace: boolean;
};

const VALIDATIONS = {
  defaults: (value: unknown) => {
    if (!isJsonObject(value)) {
      return new ROOT_CONFIG_ERRORS.InvalidRootConfig(
        `Root config "defaults" must be an object`,
      );
    }
    if ("parallelMax" in value && typeof value.parallelMax !== "number") {
      return new ROOT_CONFIG_ERRORS.InvalidRootConfig(
        `The "parallelMax" value in root config "defaults" must be a number`,
      );
    }
    if ("shell" in value && typeof value.shell !== "string") {
      if (typeof value.shell !== "string") {
        return new ROOT_CONFIG_ERRORS.InvalidRootConfig(
          `The "shell" value in root config "defaults" must be a string`,
        );
      }
      validateScriptShellOption(value.shell);
    }
    return null;
  },
  includeRootWorkspace: (value: unknown) => {
    if (value !== undefined) {
      if (typeof value !== "boolean") {
        return new ROOT_CONFIG_ERRORS.InvalidRootConfig(
          `The "includeRootWorkspace" value in root config must be a boolean`,
        );
      }
    }
    return null;
  },
} as const satisfies Record<
  keyof RootConfig,
  (value: unknown) => BunWorkspacesError | null
>;

export const validateRootConfig = (config: RootConfig) => {
  if (!isJsonObject(config)) {
    return [
      new ROOT_CONFIG_ERRORS.InvalidRootConfig(
        `Workspace config must be an object`,
      ),
    ];
  }

  const errors: BunWorkspacesError[] = [];
  for (const [key, value] of Object.entries(config)) {
    const error = VALIDATIONS[key as keyof RootConfig](value);
    if (error) errors.push(error);
  }

  return errors;
};

export const resolveRootConfig = (config: RootConfig): ResolvedRootConfig => {
  const includeRootWorkspace =
    config.includeRootWorkspace ??
    getUserEnvVar("includeRootWorkspace") === "true";

  return {
    defaults: {
      parallelMax: determineParallelMax(
        config.defaults?.parallelMax ?? "default",
      ),
      shell: resolveScriptShell(config.defaults?.shell),
    },
    includeRootWorkspace: includeRootWorkspace,
  };
};

export const createRootConfig = (config?: RootConfig): ResolvedRootConfig =>
  resolveRootConfig(config ?? {});
