import fs from "fs";
import path from "path";
import { parseJSONC, type AnyFunction } from "../../internal/core";
import { logger } from "../../internal/logger";
import {
  CONFIG_LOCATION_TYPES,
  type ConfigLocation,
  type ConfigLocationType,
} from "./configLocation";

const LOCATION_FINDERS: Record<
  ConfigLocationType,
  (
    directory: string,
    fileName: string,
    packageJsonKey: string,
  ) => ConfigLocation | null
> = {
  jsoncFile: (directory: string, fileName: string) => {
    const configFilePath = path.join(directory, fileName, ".jsonc");
    if (fs.existsSync(configFilePath)) {
      return {
        type: "jsoncFile",
        content: parseJSONC(fs.readFileSync(configFilePath, "utf8")),
        path: path.relative(process.cwd(), configFilePath),
      };
    }
    return null;
  },
  jsonFile: (directory: string, fileName: string) => {
    const configFilePath = path.join(directory, fileName, ".json");
    if (fs.existsSync(configFilePath)) {
      return {
        type: "jsonFile",
        content: parseJSONC(fs.readFileSync(configFilePath, "utf8")),
        path: path.relative(process.cwd(), configFilePath),
      };
    }
    return null;
  },
  packageJson: (
    directory: string,
    _fileName: string,
    packageJsonKey: string,
  ) => {
    const packageJsonPath = path.join(directory, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8"),
        );
        if (packageJson[packageJsonKey]) {
          return {
            type: "packageJson",
            path: `package.json["${packageJsonKey}"]`,
            content: packageJson[packageJsonKey],
          };
        }
      } catch (error) {
        logger.error(error as Error);
        return null;
      }
    }
    return null;
  },
};

export const getConfigLocation = (
  directory: string,
  fileName: string,
  packageJsonKey: string,
): ConfigLocation | null => {
  const locations: ConfigLocation[] = [];
  for (const locationType of CONFIG_LOCATION_TYPES) {
    try {
      const location = LOCATION_FINDERS[locationType](
        directory,
        fileName,
        packageJsonKey,
      );
      if (location) {
        locations.push(location);
      }
    } catch (error) {
      if (!locations.length) {
        logger.error(error as Error);
      }
      return null;
    }
  }

  if (locations.length > 1) {
    logger.warn(
      `Found multiple configs at:\n  ${locations
        .map((location) => location.path)
        .join("\n")}\n  Using config at ${locations[0]?.path}`,
    );
  }

  return locations[0] ?? null;
};

export const loadConfig = <ProcessContent extends AnyFunction>(
  directory: string,
  fileName: string,
  packageJsonKey: string,
  processContent: ProcessContent,
): ReturnType<ProcessContent> | null => {
  const location = getConfigLocation(directory, fileName, packageJsonKey);
  if (!location) {
    return null;
  }
  return processContent(location.content);
};
