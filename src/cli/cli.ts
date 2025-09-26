import { createCommand, Command } from "commander";
import packageJson from "../../package.json";
import {
  getRequiredBunVersion,
  validateCurrentBunVersion,
} from "../internal/bunVersion";
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

export const createCliProgram = ({
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
        .description("CLI for utilities for Bun workspaces")
        .version(packageJson.version)
        .configureOutput({
          writeOut: (s) => logger.info(s),
          writeErr: (s) =>
            s.startsWith("Usage") ? logger.info(s) : logger.error(s),
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

      const args = typeof argv === "string" ? argv.split(" ") : argv;

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
      errorListener(error as Error);
    } finally {
      process.off("unhandledRejection", errorListener);
    }
  };

  return {
    run,
  };
};
