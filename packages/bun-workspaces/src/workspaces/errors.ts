import { defineErrors } from "../internal/error";

export const ERRORS = defineErrors(
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
