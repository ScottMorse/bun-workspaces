import path from "path";
import { type Command, Option } from "commander";
import { loadConfigFile, type BunWorkspacesConfig } from "../config";
import { LOG_LEVELS, logger, type LogLevelSetting } from "../internal/logger";
import { createProject } from "../project";

export interface CliGlobalOptions {
  logLevel: LogLevelSetting;
  cwd: string;
  configFile?: string;
}

export type CliGlobalOptionName = keyof CliGlobalOptions;

const getWorkingDirectory = (
  program: Command,
  args: string[],
  defaultCwd: string,
) => {
  program.addOption(
    new Option("-d --cwd <path>", "Working directory").default(defaultCwd),
  );
  program.parseOptions(args);
  return program.opts().cwd;
};

const getConfig = (program: Command, args: string[]) => {
  program.addOption(new Option("-c --configFile <path>", "Config file"));
  program.parseOptions(args);
  return program.opts().configFile;
};

const defineGlobalOptions = (
  program: Command,
  args: string[],
  defaultCwd: string,
) => {
  const cwd = getWorkingDirectory(program, args, defaultCwd);

  const configFilePath = getConfig(program, args);

  const config = loadConfigFile(configFilePath, cwd);

  const globalOptions: {
    [K in Exclude<CliGlobalOptionName, "configFile" | "cwd">]: {
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

  return { cwd, config };
};

const applyGlobalOptions = (
  options: CliGlobalOptions,
  config: BunWorkspacesConfig | null,
) => {
  logger.printLevel = options.logLevel;
  logger.debug("Log level: " + options.logLevel);

  const project = createProject({
    rootDir: options.cwd,
    workspaceAliases: config?.project?.workspaceAliases ?? {},
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

  const { cwd, config } = defineGlobalOptions(program, args, defaultCwd);

  program.parseOptions(args);
  program.allowUnknownOption(false);

  const options = program.opts() as CliGlobalOptions;

  return applyGlobalOptions(
    {
      ...options,
      cwd,
    },
    config,
  );
};
