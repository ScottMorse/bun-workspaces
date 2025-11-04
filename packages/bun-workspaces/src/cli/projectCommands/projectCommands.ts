import type { ProjectCommandContext } from "./commandHandlerUtils";
import {
  listScripts,
  runScript,
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
