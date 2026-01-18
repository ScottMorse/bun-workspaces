import fs from "fs";
import path from "path";
import { defineErrors } from "../../internal/core";
import { logger } from "../../internal/logger";
import { WORKSPACE_ERRORS } from "../../workspaces";
import {
  resolveRootConfig,
  validateRootConfig,
  type RootConfig,
} from "./rootConfig";
import {
  ROOT_CONFIG_FILE_PATH,
  ROOT_CONFIG_PACKAGE_JSON_KEY,
} from "./rootConfigLocation";

export const ROOT_CONFIG_ERRORS = defineErrors(
  "InvalidRootConfig",
  "InvalidRootConfigFileFormat",
);

export const getPackageJsonConfig = (workspacePath: string) => {
  const packageJsonPath = path.resolve(workspacePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return packageJson[ROOT_CONFIG_PACKAGE_JSON_KEY] ?? null;
  } catch (error) {
    throw new WORKSPACE_ERRORS.InvalidPackageJson(
      `Failed to parse workspace package.json at path "${packageJsonPath}": ${(error as Error).message}`,
    );
  }
};

export const getFileConfig = (workspacePath: string) => {
  const configFilePath = path.resolve(workspacePath, ROOT_CONFIG_FILE_PATH);
  if (!fs.existsSync(configFilePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  } catch (error) {
    throw new ROOT_CONFIG_ERRORS.InvalidRootConfigFileFormat(
      `Failed to parse workspace config file at path "${configFilePath}": ${(error as Error).message}`,
    );
  }
};

export const loadRootConfig = (rootPath: string) => {
  let packageJsonConfig: RootConfig | null = null;
  let fileConfig: RootConfig | null = null;

  try {
    packageJsonConfig = getPackageJsonConfig(rootPath);
  } catch (error) {
    logger.error(error as Error);
    return null;
  }

  try {
    fileConfig = getFileConfig(rootPath);
  } catch (error) {
    logger.error(error as Error);
    return null;
  }

  if (fileConfig && packageJsonConfig) {
    logger.warn(
      `Found root config at path "${rootPath}" in both package.json and ${ROOT_CONFIG_FILE_PATH}. The config in ${ROOT_CONFIG_FILE_PATH} will be used.`,
    );
  }

  const rawConfig = fileConfig ?? packageJsonConfig;

  if (!rawConfig) return null;

  return resolveRootConfig(rawConfig);
};
