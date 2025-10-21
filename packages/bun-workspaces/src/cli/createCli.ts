import { createCommand, type Command } from "commander";
import packageJson from "../../package.json";
import {
  getRequiredBunVersion,
  validateCurrentBunVersion,
} from "../internal/bunVersion";
import { IS_TEST } from "../internal/env";
import { BunWorkspacesError } from "../internal/error";
import { logger } from "../internal/logger";
import { initializeWithGlobalOptions } from "./globalOptions";
import { defineProjectCommands } from "./projectCommands";

export interface RunCliOptions {
  argv?: string | string[];
}

export interface CliProgram {
  run: (options?: RunCliOptions) => Promise<void>;
}

export interface CreateCliProgramOptions {
  handleError?: (error: Error) => void;
  postInit?: (program: Command) => unknown;
  defaultCwd?: string;
}

export const createCli = ({
  handleError,
  postInit,
  defaultCwd = process.cwd(),
}: CreateCliProgramOptions = {}): CliProgram => {
  const run = async ({ argv = process.argv }: RunCliOptions = {}) => {
    const errorListener =
      handleError ??
      ((error) => {
        logger.error(error);
        logger.error("Unhandled rejection");
        process.exit(1);
      });

    process.on("unhandledRejection", errorListener);

    try {
      const program = createCommand("bunx bun-workspaces")
        .description("A CLI for managing native Bun workspaces")
        .version(packageJson.version)
        .showHelpAfterError(true)
        .configureOutput({
          writeOut: (s) => s.trim() && logger.info(s.trim()),
          writeErr: (s) =>
            s.trim() &&
            logger[s.startsWith("Usage") ? "info" : "error"](s.trim()),
        });

      postInit?.(program);

      if (!validateCurrentBunVersion()) {
        logger.error(
          `Bun version mismatch. Required: ${getRequiredBunVersion()}, Found: ${
            Bun.version
          }`,
        );
        process.exit(1);
      }

      const args = tempFixCamelCaseOptions(
        typeof argv === "string" ? argv.split(/s+/) : argv,
      );

      const { project } = initializeWithGlobalOptions(
        program,
        args,
        defaultCwd,
      );
      if (!project) return;

      defineProjectCommands({
        program,
        project,
      });

      await program.parseAsync(args);
    } catch (error) {
      if (error instanceof BunWorkspacesError) {
        logger.error("Error " + error.name + ": " + error.message);
        if (!IS_TEST) process.exit(1);
      } else {
        errorListener(error as Error);
      }
    } finally {
      process.off("unhandledRejection", errorListener);
    }
  };

  return {
    run,
  };
};

/**
 * @todo
 * ! Temp backwards support for deprecated camel case options
 * ! Added October 2025, drop support in some reasonable future release
 */
const tempOptions = {
  "--nameOnly": "--name-only",
  "--noPrefix": "--no-prefix",
  "--configFile": "--config-file",
  "--logLevel": "--log-level",
};
const tempFixCamelCaseOptions = (args: string[]) =>
  args.map((arg) => {
    for (const [camel, kebab] of Object.entries(tempOptions)) {
      if (arg.startsWith(camel)) {
        return arg.replace(camel, kebab);
      }
    }
    return arg;
  });
