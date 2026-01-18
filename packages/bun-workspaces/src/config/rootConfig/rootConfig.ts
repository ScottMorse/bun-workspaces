import {
  BunWorkspacesError,
  validateJSONShape,
  type JSONObjectValidationConfig,
  type JSONValidationConfigToType,
  type RequiredDeep,
} from "../../internal/core";
import type { ShellOption } from "../../project";
import { determineParallelMax, resolveScriptShell } from "../../runScript";
import { getUserEnvVar } from "../userEnvVars";

export type RootConfigDefaults = {
  parallelMax?: number;
  shell?: ShellOption;
};

const ROOT_CONFIG_VALIDATION_CONFIG = {
  properties: {
    defaults: {
      type: {
        properties: {
          parallelMax: {
            type: {
              primitive: "number",
            },
            optional: true,
          },
          shell: {
            type: {
              primitive: "string",
            },
            optional: true,
          },
        },
      },
    },
    includeRootWorkspace: {
      type: {
        primitive: "boolean",
      },
      optional: true,
    },
  },
} as const satisfies JSONObjectValidationConfig;

export type RootConfig = JSONValidationConfigToType<
  typeof ROOT_CONFIG_VALIDATION_CONFIG
>;

export type ResolvedRootConfig = RequiredDeep<RootConfig>;

export const validateRootConfig = (
  config: RootConfig,
  configErrorName = "root config",
) => {
  const errors = validateJSONShape(
    config,
    "config",
    ROOT_CONFIG_VALIDATION_CONFIG,
  );
  if (errors.length) {
    return new BunWorkspacesError(
      `Invalid ${configErrorName}: ${errors.map((error) => error.message).join("\n")}`,
    );
  }
  return null;
};

export const resolveRootConfig = (
  config: RootConfig,
  configErrorName = "root config",
): ResolvedRootConfig => {
  validateRootConfig(config, configErrorName);

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
    includeRootWorkspace,
  };
};
