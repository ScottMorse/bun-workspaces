import path from "path";
import type { Workspace } from "../workspaces";

export const SCRIPT_COMMAND_METHODS = ["cd", "filter"] as const;

export type ScriptCommandMethod = (typeof SCRIPT_COMMAND_METHODS)[number];

export interface CreateScriptCommandOptions {
  method: ScriptCommandMethod;
  scriptName: string;
  args: string;
  workspace: Workspace;
  rootDir: string;
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
  cd: ({ scriptName, workspace, rootDir, args }) => ({
    cwd: path.resolve(rootDir, workspace.path),
    command: `bun --silent run ${scriptName}${spaceArgs(args)}`,
  }),
  filter: ({ scriptName, workspace, args, rootDir }) => ({
    cwd: rootDir,
    command: `bun --silent run --filter=${JSON.stringify(
      workspace.name,
    )} ${scriptName}${spaceArgs(args)}`,
  }),
};

export const createScriptCommand = (options: CreateScriptCommandOptions) =>
  METHODS[options.method](options);
