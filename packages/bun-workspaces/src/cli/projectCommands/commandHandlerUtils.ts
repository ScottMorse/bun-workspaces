import { Option, type Command } from "commander";
import { createLogger } from "../../internal/logger";
import type { FileSystemProject } from "../../project/implementations/fileSystemProject";
import type { Workspace } from "../../workspaces";
import {
  getProjectCommandConfig,
  type CliProjectCommandName,
} from "./projectCommandsConfig";

/** @todo DRY use of output text in cases such as having no workspaces/scripts */

export interface ProjectCommandContext {
  project: FileSystemProject;
  projectError: Error | null;
  program: Command;
}

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

export const handleCommand = <T extends unknown[]>(
  commandName: CliProjectCommandName,
  handler: (
    context: Omit<ProjectCommandContext, "projectError">,
    ...actionArgs: T
  ) => void,
) => {
  const config = getProjectCommandConfig(commandName);
  return ({ program, project, projectError }: ProjectCommandContext) => {
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
    if (!projectError) {
      program = program.action((...actionArgs) =>
        handler({ program, project }, ...(actionArgs as T)),
      );
    }
    return program;
  };
};
