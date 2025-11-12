import { validateLogLevel, type LogLevelSetting } from "../internal/logger";
import { ERRORS } from "./errors";

export interface CliConfig {
  logLevel?: LogLevelSetting;
}

export interface ProjectConfig {
  /** @deprecated A map of aliases to a workspace name */
  workspaceAliases?: Record<string, string>;
}

/** @deprecated */
export interface BunWorkspacesConfig {
  cli?: CliConfig;
  project?: ProjectConfig;
}

const isJsonObject = (value: unknown) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const validateCliConfig = (cliConfig: CliConfig) => {
  if (!isJsonObject(cliConfig)) {
    throw new ERRORS.InvalidConfigFile(`Config file: "cli" must be an object`);
  }

  if (cliConfig?.logLevel) {
    validateLogLevel(cliConfig.logLevel);
  }
};

const validateProjectConfig = (projectConfig: ProjectConfig) => {
  if (!isJsonObject(projectConfig)) {
    throw new ERRORS.InvalidConfigFile(
      `Config file: "project" must be an object`,
    );
  }

  if (projectConfig?.workspaceAliases !== undefined) {
    if (!isJsonObject(projectConfig.workspaceAliases)) {
      throw new ERRORS.InvalidConfigFile(
        `Config file: project.workspaceAliases must be an object`,
      );
    }
    for (const alias of Object.values(projectConfig.workspaceAliases)) {
      if (typeof alias !== "string") {
        throw new ERRORS.InvalidConfigFile(
          `Config file: project.workspaceAliases must be an object with string keys and values`,
        );
      }
    }
  }
};

/** @deprecated */
export const validateBunWorkspacesConfig = (config: BunWorkspacesConfig) => {
  if (!isJsonObject(config)) {
    throw new ERRORS.InvalidConfigFile(`Config file: must be an object`);
  }

  if (typeof config.cli !== "undefined") {
    validateCliConfig(config.cli);
  }
  if (typeof config.project !== "undefined") {
    validateProjectConfig(config.project);
  }
};
