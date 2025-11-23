import { defineErrors } from "../internal/error";

export const PROJECT_ERRORS = defineErrors(
  "ProjectWorkspaceNotFound",
  "WorkspaceScriptDoesNotExist",
);
