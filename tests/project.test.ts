import path from "path";
import { expect, test as _test, describe } from "bun:test";
import type { Workspace } from "../src";
import { createProject, type Project } from "../src/project";
import { ERRORS } from "../src/project/errors";
import type { ScriptMetadata } from "../src/project/project";
import { getProjectRoot } from "./testProjects";

const test = (name: string, callback: (project: Project) => void) =>
  _test(name, async () => {
    const project = createProject({
      rootDir: getProjectRoot("fullProject"),
    });
    return callback(project);
  });

const stripPackageJson = (workspace: Workspace) => {
  const { packageJson: _, ...rest } = workspace;
  return rest;
};

const stripToName = (workspace: Workspace) => workspace.name;

describe("Test Project utilities", () => {
  test("Project properties", async (project) => {
    expect(project.name).toEqual("test-root");
    expect(project.rootDir).toEqual(getProjectRoot("fullProject"));
    expect(project.workspaces).toEqual([
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
    ]);
  });

  test("Project.prototype.findWorkspaceByName", async (project) => {
    expect(project.findWorkspaceByName("not-a-workspace")).toBeNull();

    const appA = project.findWorkspaceByName("application-a");
    expect(appA?.name).toEqual("application-a");
    expect(appA?.path).toEqual("applications/applicationA");
    expect(appA?.packageJson.name).toEqual("application-a");
    expect(appA?.matchPattern).toEqual("applications/*");

    const libC = project.findWorkspaceByName("library-c");
    expect(libC?.name).toEqual("library-c");
    expect(libC?.path).toEqual("libraries/nested/libraryC");
    expect(libC?.packageJson.name).toEqual("library-c");
    expect(libC?.matchPattern).toEqual("libraries/**/*");
  });

  test("Project.prototype.findWorkspacesByPattern", async (project) => {
    expect(project.findWorkspacesByPattern("not-a-workspace")).toEqual([]);

    expect(project.findWorkspacesByPattern("").map(stripToName)).toEqual([]);
    expect(project.findWorkspacesByPattern("*").map(stripToName)).toEqual([
      "application-a",
      "application-b",
      "library-a",
      "library-b",
      "library-c",
    ]);

    expect(
      project.findWorkspacesByPattern("application-*").map(stripToName),
    ).toEqual(["application-a", "application-b"]);

    expect(
      project.findWorkspacesByPattern("library-*").map(stripToName),
    ).toEqual(["library-a", "library-b", "library-c"]);

    expect(
      project.findWorkspacesByPattern("library-c").map(stripToName),
    ).toEqual(["library-c"]);

    expect(
      project.findWorkspacesByPattern("library-c*").map(stripToName),
    ).toEqual(["library-c"]);

    expect(project.findWorkspacesByPattern("*-c").map(stripToName)).toEqual([
      "library-c",
    ]);

    expect(project.findWorkspacesByPattern("*-b").map(stripToName)).toEqual([
      "application-b",
      "library-b",
    ]);

    expect(project.findWorkspacesByPattern("*a*-a*").map(stripToName)).toEqual([
      "application-a",
      "library-a",
    ]);

    expect(
      project.findWorkspacesByPattern("**b****-*b**").map(stripToName),
    ).toEqual(["library-b"]);
  });

  test("Project.prototype.listWorkspacesWithScript", async (project) => {
    expect(
      project.listWorkspacesWithScript("all-workspaces").map(stripPackageJson),
    ).toEqual([
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
        matchPattern: "libraries/**/*",
        path: "libraries/libraryA",
        aliases: [],
      },
      {
        name: "library-b",
        matchPattern: "libraries/**/*",
        path: "libraries/libraryB",
        aliases: [],
      },
      {
        name: "library-c",
        matchPattern: "libraries/**/*",
        path: "libraries/nested/libraryC",
        aliases: [],
      },
    ]);

    expect(
      project.listWorkspacesWithScript("a-workspaces").map(stripToName),
    ).toEqual(["application-a", "library-a"]);

    expect(
      project.listWorkspacesWithScript("b-workspaces").map(stripToName),
    ).toEqual(["application-b", "library-b"]);

    expect(
      project.listWorkspacesWithScript("c-workspaces").map(stripToName),
    ).toEqual(["library-c"]);

    expect(project.listWorkspacesWithScript("not-a-script")).toEqual([]);

    expect(
      project.listWorkspacesWithScript("application-a").map(stripToName),
    ).toEqual(["application-a"]);

    expect(
      project.listWorkspacesWithScript("application-b").map(stripToName),
    ).toEqual(["application-b"]);

    expect(
      project.listWorkspacesWithScript("library-a").map(stripToName),
    ).toEqual(["library-a"]);

    expect(
      project.listWorkspacesWithScript("library-b").map(stripToName),
    ).toEqual(["library-b"]);

    expect(
      project.listWorkspacesWithScript("library-c").map(stripToName),
    ).toEqual(["library-c"]);
  });

  const stripMetadataToWorkspaceNames = (
    metadata: Record<string, ScriptMetadata>,
  ) =>
    Object.values(metadata).reduce(
      (acc, { name, workspaces }) => ({
        ...acc,
        [name]: {
          name,
          workspaces: workspaces.map(stripToName),
        },
      }),
      {},
    );

  test("Project.prototype.listScriptsWithWorkspaces", async (project) => {
    expect(
      stripMetadataToWorkspaceNames(project.listScriptsWithWorkspaces()),
    ).toEqual({
      "all-workspaces": {
        name: "all-workspaces",
        workspaces: [
          "application-a",
          "application-b",
          "library-a",
          "library-b",
          "library-c",
        ],
      },
      "a-workspaces": {
        name: "a-workspaces",
        workspaces: ["application-a", "library-a"],
      },
      "b-workspaces": {
        name: "b-workspaces",
        workspaces: ["application-b", "library-b"],
      },
      "c-workspaces": {
        name: "c-workspaces",
        workspaces: ["library-c"],
      },
      "application-a": {
        name: "application-a",
        workspaces: ["application-a"],
      },
      "application-b": {
        name: "application-b",
        workspaces: ["application-b"],
      },
      "library-a": {
        name: "library-a",
        workspaces: ["library-a"],
      },
      "library-b": {
        name: "library-b",
        workspaces: ["library-b"],
      },
      "library-c": {
        name: "library-c",
        workspaces: ["library-c"],
      },
    });
  });

  test("Project.prototype.createScriptCommand", async (project) => {
    expect(
      project.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "all-workspaces",
        workspaceName: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: path.resolve(project.rootDir, "applications/applicationA"),
        command: `bun --silent run all-workspaces`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        packageJson: expect.any(Object),
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "--watch",
        method: "cd",
        scriptName: "all-workspaces",
        workspaceName: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: path.resolve(project.rootDir, "applications/applicationA"),
        command: `bun --silent run all-workspaces --watch`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        packageJson: expect.any(Object),
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "--watch",
        method: "filter",
        scriptName: "all-workspaces",
        workspaceName: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: project.rootDir,
        command: `bun --silent run --filter="application-a" all-workspaces --watch`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        packageJson: expect.any(Object),
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: " --stuff --hello=there123",
        method: "filter",
        scriptName: "all-workspaces",
        workspaceName: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: project.rootDir,
        command: `bun --silent run --filter="application-a" all-workspaces --stuff --hello=there123`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        packageJson: expect.any(Object),
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "b-workspaces",
        workspaceName: "library-b",
      }),
    ).toEqual({
      command: {
        cwd: path.resolve(project.rootDir, "libraries/libraryB"),
        command: `bun --silent run b-workspaces`,
      },
      scriptName: "b-workspaces",
      workspace: {
        name: "library-b",
        matchPattern: "libraries/**/*",
        path: "libraries/libraryB",
        packageJson: expect.any(Object),
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "",
        method: "filter",
        scriptName: "b-workspaces",
        workspaceName: "library-b",
      }),
    ).toEqual({
      command: {
        cwd: project.rootDir,
        command: `bun --silent run --filter="library-b" b-workspaces`,
      },
      scriptName: "b-workspaces",
      workspace: {
        name: "library-b",
        matchPattern: "libraries/**/*",
        path: "libraries/libraryB",
        packageJson: expect.any(Object),
        aliases: [],
      },
    });

    expect(() =>
      project.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "not-a-script",
        workspaceName: "library-b",
      }),
    ).toThrow(ERRORS.WorkspaceScriptDoesNotExist);

    expect(() =>
      project.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "all-workspaces",
        workspaceName: "not-a-workspace",
      }),
    ).toThrow(ERRORS.ProjectWorkspaceNotFound);
  });
});
