import { expect, test, describe } from "bun:test";
import { resolveWorkspaceConfig } from "../src/config";
import { BUN_LOCK_ERRORS } from "../src/internal/bun";
import { WORKSPACE_ERRORS } from "../src/workspaces/errors";
import { findWorkspaces } from "../src/workspaces/findWorkspaces";
import { getProjectRoot } from "./testProjects";
import { withWindowsPath } from "./util/windows";

describe("Test finding workspaces", () => {
  test("Find workspaces basic behavior", async () => {
    const defaultProject = findWorkspaces({
      rootDirectory: getProjectRoot("default"),
    });

    expect(defaultProject).toEqual({
      workspaces: [
        {
          name: "application-a",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationA"),
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationB"),
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/**/*",
          path: withWindowsPath("libraries/libraryA"),
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: [],
        },
        {
          name: "library-b",
          matchPattern: "libraries/**/*",
          path: withWindowsPath("libraries/libraryB"),
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
          aliases: [],
        },
        {
          name: "library-c",
          matchPattern: "libraries/**/*",
          path: withWindowsPath("libraries/nested/libraryC"),
          scripts: ["all-workspaces", "c-workspaces", "library-c"],
          aliases: [],
        },
      ],
      workspaceConfigMap: {
        "application-a": resolveWorkspaceConfig({}),
        "application-b": resolveWorkspaceConfig({}),
        "library-a": resolveWorkspaceConfig({}),
        "library-b": resolveWorkspaceConfig({}),
        "library-c": resolveWorkspaceConfig({}),
      },
    });

    expect(defaultProject).toEqual({
      ...findWorkspaces({
        rootDirectory: getProjectRoot("default"),
        workspaceGlobs: ["applications/*", "libraries/**/*"],
      }),
    });

    expect(
      findWorkspaces({
        rootDirectory: getProjectRoot("default"),
        workspaceGlobs: ["applications/*", "libraries/*"],
      }),
    ).toEqual({
      workspaces: [
        {
          name: "application-a",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationA"),
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationB"),
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/*",
          path: withWindowsPath("libraries/libraryA"),
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: [],
        },
        {
          name: "library-b",
          matchPattern: "libraries/*",
          path: withWindowsPath("libraries/libraryB"),
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
          aliases: [],
        },
      ],
      workspaceConfigMap: {
        "application-a": resolveWorkspaceConfig({}),
        "application-b": resolveWorkspaceConfig({}),
        "library-a": resolveWorkspaceConfig({}),
        "library-b": resolveWorkspaceConfig({}),
      },
    });

    expect(
      findWorkspaces({
        rootDirectory: getProjectRoot("default"),
        workspaceGlobs: ["applications/*"],
      }),
    ).toEqual({
      workspaces: [
        {
          name: "application-a",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationA"),
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationB"),
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
      ],
      workspaceConfigMap: {
        "application-a": resolveWorkspaceConfig({}),
        "application-b": resolveWorkspaceConfig({}),
      },
    });
  });

  test("Ignore node_modules workspace", async () => {
    const defaultProject = findWorkspaces({
      rootDirectory: getProjectRoot("withNodeModuleWorkspace"),
    });

    expect(defaultProject).toEqual({
      workspaces: [
        {
          name: "application-a",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationA"),
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: withWindowsPath("applications/applicationB"),
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/**/*",
          path: withWindowsPath("libraries/libraryA"),
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: [],
        },
        {
          name: "library-b",
          matchPattern: "libraries/**/*",
          path: withWindowsPath("libraries/libraryB"),
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
          aliases: [],
        },
        {
          name: "library-c",
          matchPattern: "libraries/**/*",
          path: withWindowsPath("libraries/nested/libraryC"),
          scripts: ["all-workspaces", "c-workspaces", "library-c"],
          aliases: [],
        },
      ],
      workspaceConfigMap: {
        "application-a": resolveWorkspaceConfig({}),
        "application-b": resolveWorkspaceConfig({}),
        "library-a": resolveWorkspaceConfig({}),
        "library-b": resolveWorkspaceConfig({}),
        "library-c": resolveWorkspaceConfig({}),
      },
    });
  });

  test("Invalid workspaces from test projects", async () => {
    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadJson"),
      }),
    ).toThrow(BUN_LOCK_ERRORS.BunLockNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidNoName"),
      }),
    ).toThrow(BUN_LOCK_ERRORS.BunLockNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidDuplicateName"),
      }),
    ).toThrow(BUN_LOCK_ERRORS.BunLockNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidDuplicateAlias"),
      }),
    ).toThrow(WORKSPACE_ERRORS.AliasConflict);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("badWorkspaceInvalidName"),
      }),
    ).toThrow(WORKSPACE_ERRORS.InvalidWorkspaceName);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadTypeWorkspaces"),
      }),
    ).toThrow(BUN_LOCK_ERRORS.BunLockNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadTypeScripts"),
      }),
    ).toThrow(WORKSPACE_ERRORS.InvalidScripts);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidNoPackageJson"),
      }),
    ).toThrow(BUN_LOCK_ERRORS.BunLockNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadWorkspaceGlobType"),
      }),
    ).toThrow(BUN_LOCK_ERRORS.BunLockNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadWorkspaceGlobOutsideRoot"),
      }),
    ).toThrow(BUN_LOCK_ERRORS.BunLockNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidAliasConflict"),
        workspaceAliases: {
          deprecated_appA: "application-a",
          "application-b": "library-a",
        },
      }),
    ).toThrow(WORKSPACE_ERRORS.AliasConflict);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidAliasNotFound"),
        workspaceAliases: {
          deprecated_appA: "application-a",
          appD: "application-d",
        },
      }),
    ).toThrow(WORKSPACE_ERRORS.AliasedWorkspaceNotFound);
  });
});
