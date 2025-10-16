import path from "path";
import { type Command, Option } from "commander";
import { loadConfigFile, type BunWorkspacesConfig } from "../../config";
import { logger } from "../../internal/logger";
import { createProject } from "../../project";
import {
  type CliGlobalOptionName,
  type CliGlobalOptions,
  getCliGlobalOptionConfig,
} from "./globalOptionsConfig";

const addGlobalOption = (
  program: Command,
  optionName: CliGlobalOptionName,
  defaultOverride?: string,
) => {
  const { mainOption, shortOption, description, param, values, defaultValue } =
    getCliGlobalOptionConfig(optionName);
  const option = new Option(
    `${shortOption} ${mainOption}${param ? ` <${param}>` : ""}`,
    description,
  ).default(defaultOverride ?? defaultValue);
  program.addOption(
    values?.length ? option.choices(values as string[]) : option,
  );
};

const getWorkingDirectory = (
  program: Command,
  args: string[],
  defaultCwd: string,
) => {
  addGlobalOption(program, "cwd", defaultCwd);
  program.parseOptions(args);
  return program.opts().cwd;
};

const getConfig = (program: Command, args: string[]) => {
  addGlobalOption(program, "configFile");
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

  addGlobalOption(program, "logLevel");

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
