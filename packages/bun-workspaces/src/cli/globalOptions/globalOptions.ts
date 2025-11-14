import fs from "node:fs";
import path from "node:path";
import { type Command, Option } from "commander";
import { loadConfigFile, type BunWorkspacesConfig } from "../../config";
import { defineErrors } from "../../internal/error";
import { logger } from "../../internal/logger";
import {
  _internalCreateFileSystemProject,
  createFileSystemProject,
} from "../../project";
import {
  type CliGlobalOptionName,
  type CliGlobalOptions,
  getCliGlobalOptionConfig,
} from "./globalOptionsConfig";

const ERRORS = defineErrors(
  "WorkingDirectoryNotFound",
  "WorkingDirectoryNotADirectory",
);

const addGlobalOption = (
  program: Command,
  optionName: CliGlobalOptionName,
  defaultOverride?: string,
) => {
  const { mainOption, shortOption, description, param, values, defaultValue } =
    getCliGlobalOptionConfig(optionName);

  let option = new Option(
    `${shortOption} ${mainOption}${param ? ` <${param}>` : ""}`,
    description,
  );

  const effectiveDefaultValue = defaultOverride ?? defaultValue;
  if (effectiveDefaultValue) {
    option = option.default(effectiveDefaultValue);
  }

  if (values?.length) {
    option = option.choices(values as string[]);
  }

  program.addOption(option);
};

const getWorkingDirectoryFromArgs = (
  program: Command,
  args: string[],
  defaultCwd: string,
) => {
  addGlobalOption(program, "cwd", defaultCwd);
  program.parseOptions(args);
  return program.opts().cwd;
};

const getConfigFileFromArgs = (program: Command, args: string[]) => {
  addGlobalOption(program, "configFile");
  program.parseOptions(args);
  return program.opts().configFile;
};

const defineGlobalOptions = (
  program: Command,
  args: string[],
  defaultCwd: string,
) => {
  const cwd = getWorkingDirectoryFromArgs(program, args, defaultCwd);

  if (!fs.existsSync(cwd)) {
    throw new ERRORS.WorkingDirectoryNotFound(
      `Working directory not found at path "${cwd}"`,
    );
  }

  if (!fs.statSync(cwd).isDirectory()) {
    throw new ERRORS.WorkingDirectoryNotADirectory(
      `Working directory is not a directory at path "${cwd}"`,
    );
  }

  const configFilePath = getConfigFileFromArgs(program, args);

  const config = loadConfigFile(configFilePath, cwd);

  if (config) {
    logger.warn(
      // TODO link to docs
      `WARNING: Using the config file at ${configFilePath} is deprecated. Please use the new workspace config instead.`,
    );
  }

  addGlobalOption(program, "logLevel");

  return { cwd, config };
};

const applyGlobalOptions = (
  options: CliGlobalOptions,
  config: BunWorkspacesConfig | null,
) => {
  logger.printLevel = options.logLevel;
  logger.debug("Log level: " + options.logLevel);

  const project = _internalCreateFileSystemProject({
    rootDirectory: options.cwd,
    workspaceAliases: config?.project?.workspaceAliases ?? {},
  });

  logger.debug(
    `Project: ${JSON.stringify(project.name)} (${
      project.workspaces.length
    } workspace${project.workspaces.length === 1 ? "" : "s"})`,
  );
  logger.debug("Project root: " + path.resolve(project.rootDirectory));

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
