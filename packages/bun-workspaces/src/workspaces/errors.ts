import { defineErrors } from "../internal/error";

export const WORKSPACE_ERRORS = defineErrors(
  "PackageNotFound",
  "InvalidPackageJson",
  "DuplicateWorkspaceName",
  "InvalidWorkspaceName",
  "NoWorkspaceName",
  "InvalidScripts",
  "InvalidWorkspaces",
  "InvalidWorkspacePattern",
  "AliasConflict",
  "AliasedWorkspaceNotFound",
);
