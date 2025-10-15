import type { BunWorkspacesConfig } from "bun-workspaces/src/config";

export const exampleConfig: BunWorkspacesConfig = {
  project: {
    workspaceAliases: {
      appA: "@my-org/application-a",
      appB: "@my-org/application-b",
    },
  },
  cli: {
    logLevel: "error",
  },
};
