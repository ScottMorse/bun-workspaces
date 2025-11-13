import fs from "fs";
import path from "path";
import { logger } from "../../internal/logger";
import {
  resolveWorkspaceConfig,
  validateWorkspaceConfig,
} from "./workspaceConfig";

export const WORKSPACE_CONFIG_FILE_PATH = "bw.workspace.json";
export const WORKSPACE_CONFIG_PACKAGE_JSON_KEY = "bw";

const getPackageJsonConfig = (workspacePath: string) => {
  const packageJsonPath = path.resolve(workspacePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return packageJson[WORKSPACE_CONFIG_PACKAGE_JSON_KEY] ?? null;
};

const getFileConfig = (workspacePath: string) => {
  const configFilePath = path.resolve(
    workspacePath,
    WORKSPACE_CONFIG_FILE_PATH,
  );
  if (!fs.existsSync(configFilePath)) {
    return null;
  }
  const configFile = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  return configFile;
};

export const loadWorkspaceConfig = (workspacePath: string) => {
  const packageJsonConfig = getPackageJsonConfig(workspacePath);
  const fileConfig = getFileConfig(workspacePath);

  const rawConfig = fileConfig ?? packageJsonConfig;

  if (fileConfig && packageJsonConfig) {
    logger.warn(
      `WARNING: Found config for workspace at path "${workspacePath}" in both package.json and ${WORKSPACE_CONFIG_FILE_PATH}. The config in ${WORKSPACE_CONFIG_FILE_PATH} will be used.`,
    );
  }

  if (!rawConfig) return null;

  const errors = validateWorkspaceConfig(rawConfig);
  if (errors) {
    errors.forEach((error) => logger.error(error.message));
    return null;
  }

  return resolveWorkspaceConfig(rawConfig);
};
