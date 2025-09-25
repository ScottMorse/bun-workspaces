import { expect, test, describe } from "bun:test";
import { ERRORS } from "../src/workspaces/errors";
import {
  findWorkspaces,
  findWorkspacesFromPackage,
} from "../src/workspaces/findWorkspaces";
import type { Workspace } from "../src/workspaces/workspace";
import { getProjectRoot } from "./testProjects";

const simplifyExpectedWorkspacesResult = <
  T extends {
    workspaces: Partial<Workspace>[];
  },
>({
  workspaces,
  ...rest
}: T) => ({
  ...rest,
  workspaces: workspaces.map((ws) => ({
    ...ws,
    packageJson: {},
  })) as Workspace[],
});

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
          packageJson: {
            name: "application-a",
            workspaces: [],
            scripts: {
              "all-workspaces": "echo 'script for all workspaces'",
              "a-workspaces": "echo 'script for a workspaces'",
              "application-a": "echo 'script for application-a'",
            },
          },
          aliases: [],
        },
        {
          name: "application-b",
          matchPattern: "applications/*",
          path: "applications/applicationB",
          packageJson: {
            name: "application-b",
            workspaces: [],
            scripts: {
              "all-workspaces": "echo 'script for all workspaces'",
              "b-workspaces": "echo 'script for b workspaces'",
              "application-b": "echo 'script for application-b'",
            },
          },
          aliases: [],
        },
        {
          name: "library-a",
          matchPattern: "libraries/**/*",
          path: "libraries/libraryA",
          packageJson: {
            name: "library-a",
            workspaces: [],
            scripts: {
              "all-workspaces": "echo 'script for all workspaces'",
              "a-workspaces": "echo 'script for a workspaces'",
              "library-a": "echo 'script for library-a'",
            },
          },
          aliases: [],
        },
        {
          name: "library-b",
          matchPattern: "libraries/**/*",
          path: "libraries/libraryB",
          packageJson: {
            name: "library-b",
            workspaces: [],
            scripts: {
              "all-workspaces": "echo 'script for all workspaces'",
              "b-workspaces": "echo 'script for b workspaces'",
              "library-b": "echo 'script for library-b'",
            },
          },
          aliases: [],
        },
        {
          name: "library-c",
          matchPattern: "libraries/**/*",
          path: "libraries/nested/libraryC",
          packageJson: {
            name: "library-c",
            workspaces: [],
            scripts: {
              "all-workspaces": "echo 'script for all workspaces'",
              "c-workspaces": "echo 'script for c workspaces'",
              "library-c": "echo 'script for library-c'",
            },
          },
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
      simplifyExpectedWorkspacesResult(
        findWorkspaces({
          rootDir: getProjectRoot("default"),
          workspaceGlobs: ["applications/*", "libraries/*"],
        }),
      ),
    ).toEqual(
      simplifyExpectedWorkspacesResult({
        workspaces: [
          {
            name: "application-a",
            matchPattern: "applications/*",
            path: "applications/applicationA",
            aliases: [],
          },
          {
            name: "application-b",
            matchPattern: "applications/*",
            path: "applications/applicationB",
            aliases: [],
          },
          {
            name: "library-a",
            matchPattern: "libraries/*",
            path: "libraries/libraryA",
            aliases: [],
          },
          {
            name: "library-b",
            matchPattern: "libraries/*",
            path: "libraries/libraryB",
            aliases: [],
          },
        ],
      }),
    );

    expect(
      simplifyExpectedWorkspacesResult(
        findWorkspaces({
          rootDir: getProjectRoot("default"),
          workspaceGlobs: ["applications/*"],
        }),
      ),
    ).toEqual(
      simplifyExpectedWorkspacesResult({
        workspaces: [
          {
            name: "application-a",
            matchPattern: "applications/*",
            path: "applications/applicationA",
            aliases: [],
          },
          {
            name: "application-b",
            matchPattern: "applications/*",
            path: "applications/applicationB",
            aliases: [],
          },
        ],
      }),
    );
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
  });
});
