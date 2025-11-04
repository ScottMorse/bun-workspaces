import { type Command } from "commander";
import { createLogger } from "../../internal/logger";
import type { Project } from "../../project";
import type { Workspace } from "../../workspaces";
import {
  getProjectCommandConfig,
  type CliProjectCommandName,
} from "./projectCommandsConfig";

/** @todo DRY use of output text in cases such as having no workspaces/scripts */

export interface ProjectCommandContext {
  project: Project;
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
  handler: (context: ProjectCommandContext, ...actionArgs: T) => void,
) => {
  const config = getProjectCommandConfig(commandName);
  return ({ program, project }: ProjectCommandContext) => {
    program = program
      .command(config.command)
      .aliases(config.aliases)
      .description(config.description);
    for (const option of Object.values(config.options)) {
      program.option(option.flags, option.description);
    }
    program = program.action((...actionArgs) =>
      handler({ program, project }, ...(actionArgs as T)),
    );
    return program;
  };
};
