import { Option, type Command } from "commander";
import { createLogger, logger } from "../../internal/logger";
import type { FileSystemProject } from "../../project/implementations/fileSystemProject";
import type { Workspace } from "../../workspaces";
import {
  getCliCommandConfig,
  type CliCommandName,
  type CliGlobalCommandName,
  type CliProjectCommandName,
} from "./commandsConfig";

/** @todo DRY use of output text in cases such as having no workspaces/scripts */

export interface GlobalCommandContext {
  program: Command;
  postTerminatorArgs: string[];
}

export type ProjectCommandContext = GlobalCommandContext & {
  project: FileSystemProject;
  projectError: Error | null;
};

export const createWorkspaceInfoLines = (workspace: Workspace) => [
  `Workspace: ${workspace.name}`,
  ` - Aliases: ${workspace.aliases.join(", ")}`,
  ` - Path: ${workspace.path}`,
  ` - Glob Match: ${workspace.matchPattern}`,
  ` - Scripts: ${workspace.scripts.join(", ")}`,
];

export const createScriptInfoLines = (
  script: string,
  workspaces: Workspace[],
) => [
  `Script: ${script}`,
  ...workspaces.map((workspace) => ` - ${workspace.name}`),
];

export const createJsonLines = (data: unknown, options: { pretty: boolean }) =>
  JSON.stringify(data, null, options.pretty ? 2 : undefined).split("\n");

export const commandOutputLogger = createLogger("");
commandOutputLogger.printLevel = "info";

const handleCommand =
  <HandlerContext extends GlobalCommandContext, ActionArgs extends unknown[]>(
    commandName: CliCommandName,
    handler: (context: HandlerContext, ...actionArgs: ActionArgs) => void,
  ) =>
  (context: HandlerContext) => {
    const config = getCliCommandConfig(commandName);
    let { program } = context;

    program = program
      .command(config.command)
      .aliases(config.aliases)
      .description(config.description);

    for (const { flags, description, values } of Object.values(
      config.options,
    )) {
      const option = new Option(flags.join(", "), description);
      if (values?.length) {
        option.choices(values);
      }
      program.addOption(option);
    }

    program = program.action((...actionArgs) =>
      handler(context, ...(actionArgs as ActionArgs)),
    );

    return program;
  };

export const handleGlobalCommand =
  <ActionArgs extends unknown[]>(
    commandName: CliGlobalCommandName,
    handler: (context: GlobalCommandContext, ...actionArgs: ActionArgs) => void,
  ) =>
  (context: GlobalCommandContext) =>
    handleCommand(commandName, handler)(context);

export const handleProjectCommand =
  <ActionArgs extends unknown[]>(
    commandName: CliProjectCommandName,
    handler: (
      context: Omit<ProjectCommandContext, "projectError">,
      ...actionArgs: ActionArgs
    ) => void,
  ) =>
  (context: ProjectCommandContext) =>
    handleCommand<ProjectCommandContext, ActionArgs>(
      commandName,
      (context, ...actionArgs) => {
        const { projectError } = context;
        if (projectError) {
          logger.error(projectError.message);
          process.exit(1);
        }
        handler(context, ...actionArgs);
      },
    )(context);
