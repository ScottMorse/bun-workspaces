import type {
  BunWorkspacesConfig,
  WorkspaceConfig,
} from "bun-workspaces/src/config";
import { WORKSPACE_CONFIG_PACKAGE_JSON_KEY } from "bun-workspaces/src/config/workspaceConfig/workspaceConfigLocation";

export const exampleWorkspaceConfigSimple: WorkspaceConfig = {
  alias: "myApp",
};

export const exampleWorkspaceConfigArray: WorkspaceConfig = {
  alias: ["myApp", "my-app"],
};

export const createPackageJsonExample = (config: WorkspaceConfig) => {
  return {
    name: "my-app",
    version: "1.0.0",
    description: "My app",
    [WORKSPACE_CONFIG_PACKAGE_JSON_KEY]: config,
    scripts: {
      start: "bun run index.js",
    },
  };
};

export const exampleDeprecatedConfig: BunWorkspacesConfig = {
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
