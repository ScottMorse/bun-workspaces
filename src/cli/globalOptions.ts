import path from "path";
import { type Command, Option } from "commander";
import { loadConfigFile } from "../config";
import { LOG_LEVELS, logger, type LogLevelSetting } from "../internal/logger";
import { createProject } from "../project";

export interface CliGlobalOptions {
  logLevel: LogLevelSetting;
  cwd: string;
  configFile?: string;
}

export type CliGlobalOptionName = keyof CliGlobalOptions;

const getConfig = (program: Command, args: string[]) => {
  program.addOption(new Option("--configFile <path>", "Config file"));
  program.parseOptions(args);
  return program.opts().configFile;
};

const defineGlobalOptions = (
  program: Command,
  args: string[],
  defaultCwd: string,
) => {
  const configFilePath = getConfig(program, args);

  const config = loadConfigFile(configFilePath);

  const globalOptions: {
    [K in Exclude<CliGlobalOptionName, "configFile">]: {
      shortName: string;
      description: string;
      defaultValue: CliGlobalOptions[K];
      values?: readonly CliGlobalOptions[K][];
      param?: string;
    };
  } = {
    logLevel: {
      shortName: "l",
      description: "Log levels",
      defaultValue:
        config?.cli?.logLevel ?? (logger.printLevel as LogLevelSetting),
      values: [...LOG_LEVELS, "silent"],
      param: "level",
    },
    cwd: {
      shortName: "d",
      description: "Working directory",
      defaultValue: config?.project?.rootDir ?? defaultCwd ?? process.cwd(),
      param: "dir",
    },
  };

  Object.entries(globalOptions).forEach(
    ([name, { shortName, description, param, values, defaultValue }]) => {
      const option = new Option(
        `-${shortName} --${name}${param ? ` <${param}>` : ""}`,
        description,
      ).default(defaultValue);

      program.addOption(
        values?.length ? option.choices(values as string[]) : option,
      );
    },
  );
};

const applyGlobalOptions = (options: CliGlobalOptions) => {
  logger.printLevel = options.logLevel;
  logger.debug("Log level: " + options.logLevel);

  const project = createProject({
    rootDir: options.cwd,
  });

  logger.debug(
    `Project: ${JSON.stringify(project.name)} (${
      project.workspaces.length
    } workspace${project.workspaces.length === 1 ? "" : "s"})`,
  );
  logger.debug("Project root: " + path.resolve(project.rootDir));

  return { project };
};

export const initializeWithGlobalOptions = (
  program: Command,
  args: string[],
  defaultCwd: string,
) => {
  program.allowUnknownOption(true);

  defineGlobalOptions(program, args, defaultCwd);

  program.parseOptions(args);
  program.allowUnknownOption(false);

  const options = program.opts() as CliGlobalOptions;

  return applyGlobalOptions(options);
};
