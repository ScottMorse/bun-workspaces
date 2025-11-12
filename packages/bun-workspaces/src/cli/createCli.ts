import { createCommand, type Command } from "commander";
import packageJson from "../../package.json";
import {
  getRequiredBunVersion,
  validateCurrentBunVersion,
} from "../internal/bunVersion";
import { BunWorkspacesError } from "../internal/error";
import { logger } from "../internal/logger";
import { fatalErrorLogger } from "./fatalErrorLogger";
import { initializeWithGlobalOptions } from "./globalOptions";
import { defineProjectCommands } from "./projectCommands";

export interface RunCliOptions {
  argv?: string | string[];
  /** Should be `true` if args do not include the binary name (e.g. `bunx bun-workspaces`) */
  programmatic?: true;
}

export interface CLI {
  run: (options?: RunCliOptions) => Promise<void>;
}

export interface CreateCliOptions {
  handleError?: (error: Error) => void;
  postInit?: (program: Command) => unknown;
  defaultCwd?: string;
}

export const createCli = ({
  handleError,
  postInit,
  defaultCwd = process.cwd(),
}: CreateCliOptions = {}): CLI => {
  const run = async ({
    argv = process.argv,
    programmatic,
  }: RunCliOptions = {}) => {
    const errorListener =
      handleError ??
      ((error) => {
        fatalErrorLogger.error(error);
        process.exit(1);
      });

    process.on("unhandledRejection", errorListener);

    try {
      const program = createCommand("bunx bun-workspaces")
        .description("A CLI on top of native Bun workspaces")
        .version(packageJson.version)
        .showHelpAfterError(true);

      postInit?.(program);

      if (!validateCurrentBunVersion()) {
        fatalErrorLogger.error(
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

      await program.parseAsync(args, {
        from: programmatic ? "user" : "node",
      });
    } catch (error) {
      if (error instanceof BunWorkspacesError) {
        logger.debug(error);
        fatalErrorLogger.error(error.message);
        process.exit(1);
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
