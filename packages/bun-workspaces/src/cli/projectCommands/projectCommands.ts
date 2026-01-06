import type { ProjectCommandContext } from "./commandHandlerUtils";
import { runScript } from "./handleRunScript";
import {
  listScripts,
  workspaceInfo,
  scriptInfo,
  listWorkspaces,
  doctor,
} from "./handleSimpleCommands";

export const defineProjectCommands = (context: ProjectCommandContext) => {
  listWorkspaces(context);
  listScripts(context);
  workspaceInfo(context);
  scriptInfo(context);
  runScript(context);
  doctor(context);
};
