import fs from "fs";
import { validateLogLevel, type LogLevelSetting } from "../internal/logger";

export interface CliConfig {
  logLevel?: LogLevelSetting;
}

export interface ProjectConfig {
  /** The directory of the project's root package.json */
  rootDir?: string;
  /** A map of aliases to a workspace name */
  workspaceAliases?: Record<string, string>;
}

export interface BunWorkspacesConfig {
  cli?: CliConfig;
  project?: ProjectConfig;
}

const validateCliConfig = (cliConfig: CliConfig) => {
  if (typeof cliConfig !== "object" || Array.isArray(cliConfig)) {
    throw new Error(`Config file: "cli" must be an object`);
  }

  if (cliConfig?.logLevel) {
    validateLogLevel(cliConfig.logLevel);
  }
};

const validateProjectConfig = (projectConfig: ProjectConfig) => {
  if (typeof projectConfig !== "object" || Array.isArray(projectConfig)) {
    throw new Error(`Config file: "project" must be an object`);
  }

  if (projectConfig?.rootDir) {
    if (typeof projectConfig.rootDir !== "string") {
      throw new Error(
        `Config file: Expected rootDir to be a string, got ${typeof projectConfig.rootDir}`,
      );
    }
    if (!fs.existsSync(projectConfig.rootDir)) {
      throw new Error(
        `Config file: project.rootDir "${projectConfig.rootDir}" does not exist`,
      );
    }
    if (!fs.statSync(projectConfig.rootDir).isDirectory()) {
      throw new Error(
        `Config file: project.rootDir "${projectConfig.rootDir}" is not a directory`,
      );
    }
  }

  if (projectConfig?.workspaceAliases) {
    if (
      typeof projectConfig.workspaceAliases !== "object" ||
      Array.isArray(projectConfig.workspaceAliases)
    ) {
      throw new Error(
        `Config file: project.workspaceAliases must be an object`,
      );
    }
    for (const alias of Object.values(projectConfig.workspaceAliases)) {
      if (typeof alias !== "string") {
        throw new Error(
          `Config file: project.workspaceAliases must be an object with string keys and values`,
        );
      }
    }
  }
};

export const validateBunWorkspacesConfig = (config: BunWorkspacesConfig) => {
  if (typeof config !== "object" || Array.isArray(config)) {
    throw new Error(`Config file: must be an object`);
  }

  if (typeof config.cli !== "undefined") {
    validateCliConfig(config.cli);
  }
  if (typeof config.project !== "undefined") {
    validateProjectConfig(config.project);
  }
};
