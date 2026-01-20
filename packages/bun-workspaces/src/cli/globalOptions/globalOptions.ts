import fs from "node:fs";
import path from "node:path";
import { type Command, Option } from "commander";
import {
  DEFAULT_CONFIG_FILE_PATH,
  loadConfigFile,
  type BunWorkspacesConfig,
} from "../../config";
import { defineErrors } from "../../internal/core";
import { logger } from "../../internal/logger";
import {
  _internalCreateFileSystemProject,
  createMemoryProject,
  type FileSystemProject,
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
  return program.opts().configFile as string | undefined;
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
      `Using the config file at ${configFilePath || DEFAULT_CONFIG_FILE_PATH} is deprecated. Migrate to the new workspace config file.`,
    );
  }

  addGlobalOption(program, "logLevel");

  return { cwd, config };
};

const applyGlobalOptions = (
  options: CliGlobalOptions,
  config: BunWorkspacesConfig | null,
  forceSilent: boolean,
) => {
  logger.printLevel = forceSilent ? "silent" : options.logLevel;
  logger.debug("Log level: " + options.logLevel);

  let project: FileSystemProject;
  let error: Error | null = null;
  try {
    project = _internalCreateFileSystemProject({
      rootDirectory: options.cwd,
      workspaceAliases: config?.project?.workspaceAliases ?? {},
    });

    logger.debug(
      `Project: ${JSON.stringify(project.name)} (${
        project.workspaces.length
      } workspace${project.workspaces.length === 1 ? "" : "s"})`,
    );
    logger.debug("Project root: " + path.resolve(project.rootDirectory));
  } catch (_error) {
    error = _error as Error;
    project = createMemoryProject({
      workspaces: [],
    }) as unknown as FileSystemProject;
  }

  return { project, projectError: error };
};

export const initializeWithGlobalOptions = (
  program: Command,
  args: string[],
  defaultCwd: string,
  forceSilent: boolean,
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
    forceSilent,
  );
};
