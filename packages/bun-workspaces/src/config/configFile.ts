import fs from "fs";
import path from "path";
import {
  validateBunWorkspacesConfig,
  type BunWorkspacesConfig,
} from "./bunWorkspacesConfig";
import { ERRORS } from "./errors";

export const DEFAULT_CONFIG_FILE_PATH = "bw.json";

/** @deprecated */
export const loadConfigFile = (filePath?: string, rootDirectory = ".") => {
  if (!filePath) {
    const defaultFilePath = path.resolve(
      rootDirectory,
      DEFAULT_CONFIG_FILE_PATH,
    );
    if (fs.existsSync(defaultFilePath)) {
      filePath = defaultFilePath;
    } else {
      return null;
    }
  }

  filePath = path.resolve(rootDirectory, filePath);

  if (!fs.existsSync(filePath)) {
    throw new ERRORS.ConfigFileNotFound(
      `Config file not found at path "${filePath}"`,
    );
  }

  const configFile = fs.readFileSync(filePath, "utf8");

  let json: BunWorkspacesConfig | null = null;
  try {
    json = JSON.parse(configFile);
  } catch (error) {
    throw new ERRORS.InvalidConfigFileFormat(
      `Failed to parse config file at path "${filePath}": ${(error as Error).message}`,
    );
  }

  if (json) validateBunWorkspacesConfig(json);

  return json;
};
