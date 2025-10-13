import { LOG_LEVELS, type LogLevelSetting } from "../../internal/logger";

export interface CliGlobalOptions {
  logLevel: LogLevelSetting;
  cwd: string;
  configFile?: string;
}

export interface CliGlobalOptionConfig {
  shortName: string;
  description: string;
  defaultValue: string;
  values: LogLevelSetting[] | null;
  param: string;
}

export const CLI_GLOBAL_OPTIONS_CONFIG = {
  logLevel: {
    shortName: "l",
    description: "Log levels",
    defaultValue: "info",
    values: [...LOG_LEVELS, "silent"],
    param: "level",
  },
  cwd: {
    shortName: "d",
    description: "Working directory",
    defaultValue: ".",
    values: null,
    param: "path",
  },
  configFile: {
    shortName: "c",
    description: "Config file",
    defaultValue: "",
    values: null,
    param: "path",
  },
} as const satisfies Record<keyof CliGlobalOptions, CliGlobalOptionConfig>;

export type CliGlobalOptionName = keyof CliGlobalOptions;
