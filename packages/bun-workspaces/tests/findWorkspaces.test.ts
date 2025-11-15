import { expect, test, describe } from "bun:test";
import { WORKSPACE_ERRORS } from "../src/workspaces/errors";
import { findWorkspaces } from "../src/workspaces/findWorkspaces";
import { getProjectRoot } from "./testProjects";

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
          path: "applications/applicationA",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: "applications/applicationB",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/**/*",
          path: "libraries/libraryA",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: [],
        },
        {
          name: "library-b",
          matchPattern: "libraries/**/*",
          path: "libraries/libraryB",
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
          aliases: [],
        },
        {
          name: "library-c",
          matchPattern: "libraries/**/*",
          path: "libraries/nested/libraryC",
          scripts: ["all-workspaces", "c-workspaces", "library-c"],
          aliases: [],
        },
      ],
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
          path: "applications/applicationA",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: "applications/applicationB",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/*",
          path: "libraries/libraryA",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: [],
        },
        {
          name: "library-b",
          matchPattern: "libraries/*",
          path: "libraries/libraryB",
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
          aliases: [],
        },
      ],
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
          path: "applications/applicationA",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: "applications/applicationB",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
      ],
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
          path: "applications/applicationA",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: "applications/applicationB",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/**/*",
          path: "libraries/libraryA",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: [],
        },
        {
          name: "library-b",
          matchPattern: "libraries/**/*",
          path: "libraries/libraryB",
          scripts: ["all-workspaces", "b-workspaces", "library-b"],
          aliases: [],
        },
        {
          name: "library-c",
          matchPattern: "libraries/**/*",
          path: "libraries/nested/libraryC",
          scripts: ["all-workspaces", "c-workspaces", "library-c"],
          aliases: [],
        },
      ],
    });
  });

  test("Supports negation globs in workspaces field in package.json", async () => {
    expect(
      findWorkspaces({
        rootDirectory: getProjectRoot("negationGlobs"),
      }),
    ).toEqual({
      workspaces: [
        {
          name: "application-a",
          matchPattern: "applications/*",
          path: "applications/applicationA",
          scripts: ["a-workspaces", "all-workspaces", "application-a"],
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: "applications/applicationB",
          scripts: ["all-workspaces", "application-b", "b-workspaces"],
          aliases: [],
        },
        {
          name: "group-b-other-a",
          matchPattern: "other/**/*",
          path: "other/groupB/otherA",
          scripts: ["all-workspaces"],
          aliases: [],
        },
        {
          name: "group-b-other-b",
          matchPattern: "other/**/*",
          path: "other/groupB/otherB",
          scripts: ["all-workspaces"],
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/**/*",
          path: "libraries/libraryA",
          scripts: ["a-workspaces", "all-workspaces", "library-a"],
          aliases: [],
        },
        {
          name: "library-c",
          matchPattern: "libraries/**/*",
          path: "libraries/nested/libraryC",
          scripts: ["all-workspaces", "c-workspaces", "library-c"],
          aliases: [],
        },
      ],
    });
  });

  test("Invalid workspaces from test projects", async () => {
    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadJson"),
      }),
    ).toThrow(WORKSPACE_ERRORS.InvalidPackageJson);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidNoName"),
      }),
    ).toThrow(WORKSPACE_ERRORS.NoWorkspaceName);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidDuplicateName"),
      }),
    ).toThrow(WORKSPACE_ERRORS.DuplicateWorkspaceName);

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
    ).toThrow(WORKSPACE_ERRORS.InvalidWorkspaces);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadTypeScripts"),
      }),
    ).toThrow(WORKSPACE_ERRORS.InvalidScripts);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidNoPackageJson"),
      }),
    ).toThrow(WORKSPACE_ERRORS.PackageNotFound);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadWorkspaceGlobType"),
      }),
    ).toThrow(WORKSPACE_ERRORS.InvalidWorkspacePattern);

    expect(() =>
      findWorkspaces({
        rootDirectory: getProjectRoot("invalidBadWorkspaceGlobOutsideRoot"),
      }),
    ).toThrow(WORKSPACE_ERRORS.InvalidWorkspacePattern);

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
