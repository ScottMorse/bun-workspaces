import path from "path";
import type { Workspace } from "../workspaces";

export const SCRIPT_COMMAND_METHODS = ["cd", "filter"] as const;

export type ScriptCommandMethod = (typeof SCRIPT_COMMAND_METHODS)[number];

export interface CreateScriptCommandOptions {
  /**
   * The method to use to run the script.
   * Either run in the workspace directory or use bun's --filter option.
   * Defaults to "cd".
   */
  method?: ScriptCommandMethod;
  /** The name of the script to run */
  scriptName: string;
  /** The arguments to append to the command */
  args: string;
  /** The workspace that the script belongs to */
  workspace: Workspace;
  /** The root directory of the project */
  rootDirectory: string;
}

const spaceArgs = (args: string) => (args ? ` ${args.trim()}` : "");

export interface ScriptCommand {
  command: string;
  cwd: string;
}

const METHODS: Record<
  ScriptCommandMethod,
  (options: CreateScriptCommandOptions) => ScriptCommand
> = {
  cd: ({ scriptName, workspace, rootDirectory, args }) => ({
    cwd: path.resolve(rootDirectory, workspace.path),
    command: `bun --silent run ${scriptName}${spaceArgs(args)}`,
  }),
  filter: ({ scriptName, workspace, args, rootDirectory }) => ({
    cwd: rootDirectory,
    command: `bun --silent run --filter=${JSON.stringify(
      workspace.name,
    )} ${scriptName}${spaceArgs(args)}`,
  }),
};

export const createScriptCommand = (options: CreateScriptCommandOptions) =>
  METHODS[options.method ?? "cd"](options);
