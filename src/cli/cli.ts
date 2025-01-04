import { createCommand, Command } from "commander";
import packageJson from "../../package.json";
import {
  getRequiredBunVersion,
  validateCurrentBunVersion,
} from "../internal/bunVersion";
import { logger } from "../internal/logger";
import { initializeWithGlobalOptions } from "./globalOptions";
import { OUTPUT_CONFIG } from "./output";
import { defineProjectCommands } from "./projectCommands";

export interface RunCliOptions {
  argv?: string | string[];
}

export interface CliProgram {
  run: (options?: RunCliOptions) => Promise<void>;
}

export interface CreateCliProgramOptions {
  writeOut?: (s: string) => void;
  writeErr?: (s: string) => void;
  handleError?: (error: Error) => void;
  postInit?: (program: Command) => unknown;
  defaultCwd?: string;
}

export const createCliProgram = ({
  writeOut = OUTPUT_CONFIG.writeOut,
  writeErr = OUTPUT_CONFIG.writeErr,
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
          writeOut,
          writeErr,
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
        printLines: (...lines: string[]) => writeOut(lines.join("\n") + "\n"),
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
