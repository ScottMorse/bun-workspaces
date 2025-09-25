import fs from "fs";
import path from "path";
import {
  validateBunWorkspacesConfig,
  type BunWorkspacesConfig,
} from "./bunWorkspacesConfig";

export const DEFAULT_CONFIG_FILE_PATH = "bw.json";

export const loadConfigFile = (filePath?: string, rootDir = ".") => {
  if (!filePath) {
    const defaultFilePath = path.resolve(rootDir, DEFAULT_CONFIG_FILE_PATH);
    if (fs.existsSync(defaultFilePath)) {
      filePath = defaultFilePath;
    } else {
      return null;
    }
  }

  filePath = path.resolve(rootDir, filePath);

  const configFile = fs.readFileSync(filePath, "utf8");

  try {
    const json = JSON.parse(configFile);
    validateBunWorkspacesConfig(json);
    return json as BunWorkspacesConfig;
  } catch (error) {
    throw new Error(
      `Config file: "${filePath}" is not a valid JSON file: ${error}`,
    );
  }
};
