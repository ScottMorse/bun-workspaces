import fs from "fs";
import {
  validateBunWorkspacesConfig,
  type BunWorkspacesConfig,
} from "./bunWorkspacesConfig";

export const DEFAULT_CONFIG_FILE_PATH = "bw.json";

export const loadConfigFile = (path?: string) => {
  if (!path) {
    if (fs.existsSync(DEFAULT_CONFIG_FILE_PATH)) {
      path = DEFAULT_CONFIG_FILE_PATH;
    } else {
      return null;
    }
  }

  const configFile = fs.readFileSync(path, "utf8");

  try {
    const json = JSON.parse(configFile);
    validateBunWorkspacesConfig(json);
    return json as BunWorkspacesConfig;
  } catch (error) {
    throw new Error(
      `Config file: "${path}" is not a valid JSON file: ${error}`,
    );
  }
};
