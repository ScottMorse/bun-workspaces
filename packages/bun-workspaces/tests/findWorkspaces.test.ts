import { expect, test, describe } from "bun:test";
import { ERRORS } from "../src/workspaces/errors";
import {
  findWorkspaces,
  findWorkspacesFromPackage,
} from "../src/workspaces/findWorkspaces";
import { getProjectRoot } from "./testProjects";

describe("Test finding workspaces", () => {
  test("Find workspaces basic behavior", async () => {
    const defaultProject = findWorkspacesFromPackage({
      rootDir: getProjectRoot("default"),
    });

    expect(defaultProject).toEqual({
      name: "test-root",
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
      name: "test-root",
      ...findWorkspaces({
        rootDir: getProjectRoot("default"),
        workspaceGlobs: ["applications/*", "libraries/**/*"],
      }),
    });

    expect(
      findWorkspaces({
        rootDir: getProjectRoot("default"),
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
        rootDir: getProjectRoot("default"),
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
    const defaultProject = findWorkspacesFromPackage({
      rootDir: getProjectRoot("withNodeModuleWorkspace"),
    });

    expect(defaultProject).toEqual({
      name: "test-root",
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
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("negationGlobs"),
      }),
    ).toEqual({
      name: "test-root",
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
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidBadJson"),
      }),
    ).toThrow(ERRORS.InvalidPackageJson);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidNoName"),
      }),
    ).toThrow(ERRORS.NoWorkspaceName);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidDuplicateName"),
      }),
    ).toThrow(ERRORS.DuplicateWorkspaceName);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("badWorkspaceInvalidName"),
      }),
    ).toThrow(ERRORS.InvalidWorkspaceName);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidBadTypeWorkspaces"),
      }),
    ).toThrow(ERRORS.InvalidWorkspaces);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidBadTypeScripts"),
      }),
    ).toThrow(ERRORS.InvalidScripts);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidNoPackageJson"),
      }),
    ).toThrow(ERRORS.PackageNotFound);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidBadWorkspaceGlobType"),
      }),
    ).toThrow(ERRORS.InvalidWorkspacePattern);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidBadWorkspaceGlobOutsideRoot"),
      }),
    ).toThrow(ERRORS.InvalidWorkspacePattern);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidAliasConflict"),
        workspaceAliases: {
          appA: "application-a",
          "application-b": "library-a",
        },
      }),
    ).toThrow(ERRORS.AliasConflict);

    expect(() =>
      findWorkspacesFromPackage({
        rootDir: getProjectRoot("invalidAliasNotFound"),
        workspaceAliases: {
          appA: "application-a",
          appD: "application-d",
        },
      }),
    ).toThrow(ERRORS.AliasedWorkspaceNotFound);
  });
});
