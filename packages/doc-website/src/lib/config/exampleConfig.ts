import {
  type BunWorkspacesConfig,
  type WorkspaceConfig,
  type RootConfig,
  WORKSPACE_CONFIG_PACKAGE_JSON_KEY,
  ROOT_CONFIG_PACKAGE_JSON_KEY,
} from "bun-workspaces/src/config";

export const exampleRootConfigSimple1: RootConfig = {
  defaults: {
    parallelMax: 4,
    shell: "system",
  },
};

export const exampleRootConfigSimple2: RootConfig = {
  defaults: {
    parallelMax: "50%",
    shell: "system",
  },
};

export const exampleWorkspaceConfigSimple: WorkspaceConfig = {
  alias: "myApp",
  scripts: {
    start: {
      order: 10,
    },
    test: {
      order: 20,
    },
  },
};

export const exampleWorkspaceConfigArray: WorkspaceConfig = {
  alias: ["myApp", "my-app"],
};

export const createPackageJsonExample = (
  config: object,
  target: "workspace" | "root",
) => {
  return {
    name: "@my-organization/my-application",
    version: "1.0.0",
    description: "My app",
    [target === "workspace"
      ? WORKSPACE_CONFIG_PACKAGE_JSON_KEY
      : ROOT_CONFIG_PACKAGE_JSON_KEY]: config,
    scripts: {
      start: "bun run index.js",
      test: "bun test",
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
