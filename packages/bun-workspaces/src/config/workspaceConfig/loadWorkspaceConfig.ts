import fs from "fs";
import path from "path";
import { logger } from "../../internal/logger";
import { WORKSPACE_ERRORS } from "../../workspaces";
import { WORKSPACE_CONFIG_ERRORS } from "./errors";
import {
  resolveWorkspaceConfig,
  validateWorkspaceConfig,
  type WorkspaceConfig,
} from "./workspaceConfig";
import {
  WORKSPACE_CONFIG_FILE_PATH,
  WORKSPACE_CONFIG_PACKAGE_JSON_KEY,
} from "./workspaceConfigLocation";

export const getPackageJsonConfig = (workspacePath: string) => {
  const packageJsonPath = path.resolve(workspacePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return packageJson[WORKSPACE_CONFIG_PACKAGE_JSON_KEY] ?? null;
  } catch (error) {
    throw new WORKSPACE_ERRORS.InvalidPackageJson(
      `Failed to parse workspace package.json at path "${packageJsonPath}": ${(error as Error).message}`,
    );
  }
};

export const getFileConfig = (workspacePath: string) => {
  const configFilePath = path.resolve(
    workspacePath,
    WORKSPACE_CONFIG_FILE_PATH,
  );
  if (!fs.existsSync(configFilePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  } catch (error) {
    throw new WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfigFileFormat(
      `Failed to parse workspace config file at path "${configFilePath}": ${(error as Error).message}`,
    );
  }
};

export const loadWorkspaceConfig = (workspacePath: string) => {
  let packageJsonConfig: WorkspaceConfig | null = null;
  let fileConfig: WorkspaceConfig | null = null;

  try {
    packageJsonConfig = getPackageJsonConfig(workspacePath);
  } catch (error) {
    logger.error(error as Error);
    return null;
  }

  try {
    fileConfig = getFileConfig(workspacePath);
  } catch (error) {
    logger.error(error as Error);
    return null;
  }

  if (fileConfig && packageJsonConfig) {
    logger.warn(
      `WARNING: Found config for workspace at path "${workspacePath}" in both package.json and ${WORKSPACE_CONFIG_FILE_PATH}. The config in ${WORKSPACE_CONFIG_FILE_PATH} will be used.`,
    );
  }

  const rawConfig = fileConfig ?? packageJsonConfig;

  if (!rawConfig) return null;

  const errors = validateWorkspaceConfig(rawConfig);
  if (errors.length) {
    errors.forEach((error) => logger.error(error.message));
    return null;
  }

  return resolveWorkspaceConfig(rawConfig);
};
