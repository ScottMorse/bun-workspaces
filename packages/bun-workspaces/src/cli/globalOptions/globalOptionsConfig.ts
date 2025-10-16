import { LOG_LEVELS, type LogLevelSetting } from "../../internal/logger";

export interface CliGlobalOptions {
  logLevel: LogLevelSetting;
  cwd: string;
  configFile?: string;
}

export interface CliGlobalOptionConfig {
  mainOption: string;
  shortOption: string;
  description: string;
  defaultValue: string;
  values: LogLevelSetting[] | null;
  param: string;
}

const CLI_GLOBAL_OPTIONS_CONFIG = {
  logLevel: {
    mainOption: "--logLevel",
    shortOption: "-l",
    description: "Log levels",
    defaultValue: "info",
    values: [...LOG_LEVELS, "silent"],
    param: "level",
  },
  cwd: {
    mainOption: "--cwd",
    shortOption: "-d",
    description: "Working directory",
    defaultValue: ".",
    values: null,
    param: "path",
  },
  configFile: {
    mainOption: "--configFile",
    shortOption: "-c",
    description: "Config file",
    defaultValue: "",
    values: null,
    param: "path",
  },
} as const satisfies Record<keyof CliGlobalOptions, CliGlobalOptionConfig>;

export type CliGlobalOptionName = keyof CliGlobalOptions;

export const getCliGlobalOptionConfig = (optionName: CliGlobalOptionName) =>
  CLI_GLOBAL_OPTIONS_CONFIG[optionName];
