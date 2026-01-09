import type { Command } from "commander";
import type {
  GlobalCommandContext,
  ProjectCommandContext,
} from "./commandHandlerUtils";
import { runScript } from "./handleRunScript";
import {
  listScripts,
  workspaceInfo,
  scriptInfo,
  listWorkspaces,
  doctor,
} from "./handleSimpleCommands";

export const defineGlobalCommands = (context: GlobalCommandContext) => {
  doctor(context);
};

export const defineProjectCommands = (context: ProjectCommandContext) => {
  listWorkspaces(context);
  listScripts(context);
  workspaceInfo(context);
  scriptInfo(context);
  runScript(context);
};
