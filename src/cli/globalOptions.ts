import path from "path";
import { type Command, Option } from "commander";
import { LOG_LEVELS, logger, type LogLevelSetting } from "../internal/logger";
import { createProject } from "../project";

export interface CliGlobalOptions {
  logLevel: LogLevelSetting;
  cwd: string;
}

export type CliGlobalOptionName = keyof CliGlobalOptions;

const defineGlobalOptions = (program: Command, defaultCwd: string) => {
  const globalOptions: {
    [K in CliGlobalOptionName]: {
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
      defaultValue: logger.printLevel as LogLevelSetting,
      values: [...LOG_LEVELS, "silent"],
      param: "level",
    },
    cwd: {
      shortName: "d",
      description: "Working directory",
      defaultValue: defaultCwd ?? process.cwd(),
      param: "dir",
    },
  };

  Object.entries(globalOptions).forEach(
    ([name, { shortName, description, defaultValue, param, values }]) => {
      const option = new Option(
        `-${shortName} --${name}${param ? ` <${param}>` : ""}`,
        description,
      ).default(defaultValue);

      program.addOption(values?.length ? option.choices(values) : option);
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
  defineGlobalOptions(program, defaultCwd);

  program.allowUnknownOption(true);
  program.parseOptions(args);
  program.allowUnknownOption(false);

  return applyGlobalOptions(program.opts() as CliGlobalOptions);
};
