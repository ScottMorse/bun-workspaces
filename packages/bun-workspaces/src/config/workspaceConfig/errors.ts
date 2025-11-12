import { defineErrors } from "../../internal/error";

export const WORKSPACE_CONFIG_ERRORS = defineErrors(
  "InvalidWorkspaceConfig",
  "InvalidWorkspaceConfigFileFormat",
);
