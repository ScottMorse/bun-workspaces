import path from "path";
import { expect, test, describe, spyOn } from "bun:test";
import { loadConfigFile } from "../src/config";
import {
  createWorkspaceConfig,
  getFileConfig,
  getPackageJsonConfig,
  loadWorkspaceConfig,
  validateWorkspaceConfig,
  WORKSPACE_CONFIG_ERRORS,
} from "../src/config/workspaceConfig";
import { logger } from "../src/internal/logger";
import { _internalCreateFileSystemProject } from "../src/project";
import { WORKSPACE_ERRORS, findWorkspaces } from "../src/workspaces";
import { getProjectRoot } from "./testProjects";

describe("Test workspace config", () => {
  test("loadWorkspaceConfig", () => {
    const config = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigPackageFileMix"),
        "applications/application-a",
      ),
    );

    expect(config).toEqual({
      aliases: ["appA"],
      scriptDefaults: {
        order: 1,
      },
      scripts: {},
    });

    const config2 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigPackageFileMix"),
        "applications/application-b",
      ),
    );

    expect(config2).toEqual({
      aliases: ["appB_file"],
      scriptDefaults: {
        order: 2,
      },
      scripts: {
        "all-workspaces": {
          order: 0,
        },
      },
    });

    const config3 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigPackageFileMix"),
        "libraries/library-a",
      ),
    );

    expect(config3).toEqual({
      aliases: ["libA_file"],
      scriptDefaults: {},
      scripts: {},
    });

    const config4 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigPackageFileMix"),
        "libraries/library-b",
      ),
    );

    expect(config4).toEqual({
      aliases: ["libB", "libB2"],
      scriptDefaults: {},
      scripts: {
        "all-workspaces": {
          order: 100,
        },
        "b-workspaces": {
          order: 2,
        },
      },
    });

    const config5 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigPackageFileMix"),
        "libraries/library-c",
      ),
    );
    expect(config5).toEqual({
      aliases: [],
      scriptDefaults: {},
      scripts: {},
    });

    const config6 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigPackageFileMix"),
        "applications/application-c",
      ),
    );
    expect(config6).toEqual({
      aliases: [],
      scriptDefaults: {},
      scripts: {},
    });

    const config7 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigFileOnly"),
        "applications/application-a",
      ),
    );
    expect(config7).toEqual({
      aliases: ["appA"],
      scriptDefaults: { order: 1 },
      scripts: {},
    });
  });

  test("loadWorkspaceConfig with invalid JSON", () => {
    expect(() =>
      getPackageJsonConfig(
        path.join(
          getProjectRoot("workspaceConfigInvalidJson"),
          "applications/application-a",
        ),
      ),
    ).toThrow(WORKSPACE_ERRORS.InvalidPackageJson);

    expect(
      loadWorkspaceConfig(
        path.join(
          getProjectRoot("workspaceConfigInvalidJson"),
          "applications/application-a",
        ),
      ),
    ).toBeNull();

    expect(() =>
      getFileConfig(
        path.join(
          getProjectRoot("workspaceConfigInvalidJson"),
          "applications/application-b",
        ),
      ),
    ).toThrow(WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfigFileFormat);

    expect(
      loadWorkspaceConfig(
        path.join(
          getProjectRoot("workspaceConfigInvalidJson"),
          "applications/application-b",
        ),
      ),
    ).toBeNull();
  });

  test("validateWorkspaceConfig", () => {
    const invalidResult1 = validateWorkspaceConfig({
      // @ts-expect-error - Invalid config
      alias: [["invalid"]],
    });
    expect(invalidResult1).toHaveLength(1);
    expect(invalidResult1[0]).toBeInstanceOf(
      WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig,
    );

    const invalidResult2 = validateWorkspaceConfig({
      // @ts-expect-error - Invalid config
      alias: {},
    });
    expect(invalidResult2).toHaveLength(1);
    expect(invalidResult2[0]).toBeInstanceOf(
      WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig,
    );

    const invalidResult3 = validateWorkspaceConfig({
      // @ts-expect-error - Invalid config
      alias: 123,
    });
    expect(invalidResult3).toHaveLength(1);
    expect(invalidResult3[0]).toBeInstanceOf(
      WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig,
    );

    const invalidResult4 = validateWorkspaceConfig({
      // @ts-expect-error - Invalid config
      alias: [123, null],
    });
    expect(invalidResult4).toHaveLength(1);
    expect(invalidResult4[0]).toBeInstanceOf(
      WORKSPACE_CONFIG_ERRORS.InvalidWorkspaceConfig,
    );
  });

  test("loadWorkspaceConfig with invalid config", () => {
    const invalidResult = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-a",
      ),
    );
    expect(invalidResult).toBeNull();

    const invalidResult2 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-b",
      ),
    );
    expect(invalidResult2).toBeNull();

    const invalidResult3 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-c",
      ),
    );
    expect(invalidResult3).toBeNull();

    const invalidResult4 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-d",
      ),
    );
    expect(invalidResult4).toBeNull();

    const invalidResult5 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-e",
      ),
    );
    expect(invalidResult5).toBeNull();

    const invalidResult6 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-f",
      ),
    );
    expect(invalidResult6).toBeNull();

    const invalidResult7 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-g",
      ),
    );
    expect(invalidResult7).toBeNull();

    const invalidResult8 = loadWorkspaceConfig(
      path.join(
        getProjectRoot("workspaceConfigInvalidConfig"),
        "applications/application-h",
      ),
    );
    expect(invalidResult8).toBeNull();
  });

  test("findWorkspaces results with workspace configs", () => {
    expect(
      findWorkspaces({
        rootDirectory: getProjectRoot("workspaceConfigFileOnly"),
      }),
    ).toEqual({
      workspaces: [
        {
          aliases: ["appA"],
          matchPattern: "applications/*",
          name: "application-1a",
          path: "applications/application-a",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
        },
        {
          aliases: ["appB"],
          matchPattern: "applications/*",
          name: "application-1b",
          path: "applications/application-b",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
        },
        {
          aliases: ["libA", "libA2"],
          matchPattern: "libraries/*",
          name: "library-1a",
          path: "libraries/library-a",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
        },
        {
          aliases: ["libB"],
          matchPattern: "libraries/*",
          name: "library-1b",
          path: "libraries/library-b",
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
        },
      ],
      workspaceConfigMap: {
        "application-1a": createWorkspaceConfig({
          alias: ["appA"],
          scriptDefaults: { order: 1 },
        }),
        "application-1b": createWorkspaceConfig({ alias: ["appB"] }),
        "library-1a": createWorkspaceConfig({ alias: ["libA", "libA2"] }),
        "library-1b": createWorkspaceConfig({ alias: ["libB"] }),
      },
    });

    expect(
      findWorkspaces({
        rootDirectory: getProjectRoot("workspaceConfigPackageOnly"),
      }),
    ).toEqual({
      workspaces: [
        {
          aliases: ["appA"],
          matchPattern: "applications/*",
          name: "application-1a",
          path: "applications/application-a",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
        },
        {
          aliases: ["appB", "appB2"],
          matchPattern: "applications/*",
          name: "application-1b",
          path: "applications/application-b",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
        },
        {
          aliases: ["libA", "libA2"],
          matchPattern: "libraries/*",
          name: "library-1a",
          path: "libraries/library-a",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
        },
        {
          aliases: ["libB"],
          matchPattern: "libraries/*",
          name: "library-1b",
          path: "libraries/library-b",
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
        },
      ],
      workspaceConfigMap: {
        "application-1a": createWorkspaceConfig({ alias: ["appA"] }),
        "application-1b": createWorkspaceConfig({ alias: ["appB", "appB2"] }),
        "library-1a": createWorkspaceConfig({ alias: ["libA", "libA2"] }),
        "library-1b": createWorkspaceConfig({ alias: ["libB"] }),
      },
    });

    expect(
      findWorkspaces({
        rootDirectory: getProjectRoot("workspaceConfigPackageFileMix"),
      }),
    ).toEqual({
      workspaces: [
        {
          aliases: ["appA"],
          matchPattern: "applications/*",
          name: "application-1a",
          path: "applications/application-a",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
        },
        {
          aliases: ["appB_file"],
          matchPattern: "applications/*",
          name: "application-1b",
          path: "applications/application-b",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
        },
        {
          aliases: [],
          matchPattern: "applications/*",
          name: "application-1c",
          path: "applications/application-c",
          scripts: ["all-workspaces", "application-c", "c-workspaces"],
        },
        {
          aliases: ["libA_file"],
          matchPattern: "libraries/*",
          name: "library-1a",
          path: "libraries/library-a",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
        },
        {
          aliases: ["libB", "libB2"],
          matchPattern: "libraries/*",
          name: "library-1b",
          path: "libraries/library-b",
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
        },
        {
          aliases: [],
          matchPattern: "libraries/*",
          name: "library-1c",
          path: "libraries/library-c",
          scripts: ["all-workspaces", "c-workspaces", "library-c"],
        },
      ],
      workspaceConfigMap: {
        "application-1a": createWorkspaceConfig({
          alias: ["appA"],
          scriptDefaults: { order: 1 },
        }),
        "application-1b": createWorkspaceConfig({
          alias: ["appB_file"],
          scriptDefaults: { order: 2 },
          scripts: {
            "all-workspaces": {
              order: 0,
            },
          },
        }),
        "application-1c": createWorkspaceConfig({ alias: [] }),
        "library-1a": createWorkspaceConfig({
          alias: ["libA_file"],
        }),
        "library-1b": createWorkspaceConfig({
          alias: ["libB", "libB2"],
          scripts: {
            "all-workspaces": {
              order: 100,
            },
            "b-workspaces": {
              order: 2,
            },
          },
        }),
        "library-1c": createWorkspaceConfig({ alias: [] }),
      },
    });
  });

  test("Project with mix of deprecated and new config", () => {
    const warnSpy = spyOn(logger, "warn");

    const project = _internalCreateFileSystemProject({
      rootDirectory: getProjectRoot("workspaceConfigDeprecatedConfigMix"),
      workspaceAliases:
        loadConfigFile(
          path.join(
            getProjectRoot("workspaceConfigDeprecatedConfigMix"),
            "bw.json",
          ),
        )?.project?.workspaceAliases ?? undefined,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      `Found config for workspace at path "${getProjectRoot("workspaceConfigDeprecatedConfigMix")}/libraries/library-a" in both package.json and bw.workspace.json. The config in bw.workspace.json will be used.`,
    );

    expect(project.workspaces).toEqual([
      {
        aliases: ["deprecated_appA", "appA"],
        matchPattern: "applications/*",
        name: "application-1a",
        path: "applications/application-a",
        scripts: ["a-workspaces", "all-workspaces", "application-a"],
      },
      {
        aliases: ["deprecated_appB", "appB_file"],
        matchPattern: "applications/*",
        name: "application-1b",
        path: "applications/application-b",
        scripts: ["all-workspaces", "application-b", "b-workspaces"],
      },
      {
        aliases: [],
        matchPattern: "applications/*",
        name: "application-1c",
        path: "applications/application-c",
        scripts: ["all-workspaces", "application-c", "c-workspaces"],
      },
      {
        aliases: ["deprecated_libA", "libA_file"],
        matchPattern: "libraries/*",
        name: "library-1a",
        path: "libraries/library-a",
        scripts: ["a-workspaces", "all-workspaces", "library-a"],
      },
      {
        aliases: ["deprecated_libB", "libB", "libB2"],
        matchPattern: "libraries/*",
        name: "library-1b",
        path: "libraries/library-b",
        scripts: ["all-workspaces", "b-workspaces", "library-b"],
      },
      {
        aliases: [],
        matchPattern: "libraries/*",
        name: "library-1c",
        path: "libraries/library-c",
        scripts: ["all-workspaces", "c-workspaces", "library-c"],
      },
    ]);
  });
});
