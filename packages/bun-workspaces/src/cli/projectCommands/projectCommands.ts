import type { ProjectCommandContext } from "./commandHandlerUtils";
import { runScript } from "./handleRunScript";
import {
  listScripts,
  workspaceInfo,
  scriptInfo,
  listWorkspaces,
} from "./handleSimpleCommands";

export const defineProjectCommands = (context: ProjectCommandContext) => {
  listWorkspaces(context);
  listScripts(context);
  workspaceInfo(context);
  scriptInfo(context);
  runScript(context);
};
