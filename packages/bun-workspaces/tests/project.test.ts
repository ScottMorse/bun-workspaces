import path from "path";
import { expect, test as _test, describe } from "bun:test";
import type { Workspace } from "../src";
import {
  createFileSystemProject,
  createMemoryProject,
  type FileSystemProject,
  type ScriptMetadata,
} from "../src/project";
import { ERRORS } from "../src/project/errors";
import { getProjectRoot } from "./testProjects";

const test = (name: string, callback: (project: FileSystemProject) => void) =>
  _test(name, async () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("fullProject"),
    });
    return callback(project);
  });

const stripToName = (workspace: Workspace) => workspace.name;

describe("Test Project utilities", () => {
  test("Project properties", async (project) => {
    expect(project.rootDirectory).toEqual(getProjectRoot("fullProject"));
    expect(project.sourceType).toEqual("fileSystem");
    expect(project.workspaces).toEqual([
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
    ]);
  });

  test("Project.prototype.findWorkspaceByName", async (project) => {
    expect(project.findWorkspaceByName("not-a-workspace")).toBeNull();

    const deprecated_appA = project.findWorkspaceByName("application-a");
    expect(deprecated_appA?.name).toEqual("application-a");
    expect(deprecated_appA?.path).toEqual("applications/applicationA");
    expect(deprecated_appA?.scripts).toEqual([
      "a-workspaces",
      "all-workspaces",
      "application-a",
    ]);
    expect(deprecated_appA?.matchPattern).toEqual("applications/*");

    const deprecated_libC = project.findWorkspaceByName("library-c");
    expect(deprecated_libC?.name).toEqual("library-c");
    expect(deprecated_libC?.path).toEqual("libraries/nested/libraryC");
    expect(deprecated_libC?.scripts).toEqual([
      "all-workspaces",
      "c-workspaces",
      "library-c",
    ]);
    expect(deprecated_libC?.matchPattern).toEqual("libraries/**/*");
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
    expect(project.listWorkspacesWithScript("all-workspaces")).toEqual([
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

  test("Project.prototype.mapScriptsToWorkspaces", async (project) => {
    expect(
      stripMetadataToWorkspaceNames(project.mapScriptsToWorkspaces()),
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
        workspaceNameOrAlias: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: path.resolve(project.rootDirectory, "applications/applicationA"),
        command: `bun --silent run all-workspaces`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        scripts: ["a-workspaces", "all-workspaces", "application-a"],
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "--watch",
        method: "cd",
        scriptName: "all-workspaces",
        workspaceNameOrAlias: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: path.resolve(project.rootDirectory, "applications/applicationA"),
        command: `bun --silent run all-workspaces --watch`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        scripts: ["a-workspaces", "all-workspaces", "application-a"],
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "--watch",
        method: "filter",
        scriptName: "all-workspaces",
        workspaceNameOrAlias: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: project.rootDirectory,
        command: `bun --silent run --filter="application-a" all-workspaces --watch`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        scripts: ["a-workspaces", "all-workspaces", "application-a"],
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: " --stuff --hello=there123",
        method: "filter",
        scriptName: "all-workspaces",
        workspaceNameOrAlias: "application-a",
      }),
    ).toEqual({
      command: {
        cwd: project.rootDirectory,
        command: `bun --silent run --filter="application-a" all-workspaces --stuff --hello=there123`,
      },
      scriptName: "all-workspaces",
      workspace: {
        name: "application-a",
        matchPattern: "applications/*",
        path: "applications/applicationA",
        scripts: ["a-workspaces", "all-workspaces", "application-a"],
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "b-workspaces",
        workspaceNameOrAlias: "library-b",
      }),
    ).toEqual({
      command: {
        cwd: path.resolve(project.rootDirectory, "libraries/libraryB"),
        command: `bun --silent run b-workspaces`,
      },
      scriptName: "b-workspaces",
      workspace: {
        name: "library-b",
        matchPattern: "libraries/**/*",
        path: "libraries/libraryB",
        scripts: ["all-workspaces", "b-workspaces", "library-b"],
        aliases: [],
      },
    });

    expect(
      project.createScriptCommand({
        args: "",
        method: "filter",
        scriptName: "b-workspaces",
        workspaceNameOrAlias: "library-b",
      }),
    ).toEqual({
      command: {
        cwd: project.rootDirectory,
        command: `bun --silent run --filter="library-b" b-workspaces`,
      },
      scriptName: "b-workspaces",
      workspace: {
        name: "library-b",
        matchPattern: "libraries/**/*",
        path: "libraries/libraryB",
        scripts: ["all-workspaces", "b-workspaces", "library-b"],
        aliases: [],
      },
    });

    expect(() =>
      project.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "not-a-script",
        workspaceNameOrAlias: "library-b",
      }),
    ).toThrow(ERRORS.WorkspaceScriptDoesNotExist);

    expect(() =>
      project.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "all-workspaces",
        workspaceNameOrAlias: "not-a-workspace",
      }),
    ).toThrow(ERRORS.ProjectWorkspaceNotFound);
  });

  test("MemoryProject", async () => {
    // Mainly a sanity test, as almost all functionality comes from ProjectBase and constructor logic is dead simple.

    const plainProject = createMemoryProject({
      workspaces: [],
    });

    expect(plainProject.sourceType).toEqual("memory");
    expect(plainProject.rootDirectory).toEqual("");
    expect(plainProject.workspaces).toEqual([]);
    expect(plainProject.name).toEqual("");

    const testWs1 = {
      name: "test-1",
      matchPattern: "test/*",
      scripts: ["test-script"],
      aliases: [],
      path: "test/test-1",
    };
    const testWs2 = {
      name: "test-2",
      matchPattern: "test/*",
      scripts: ["test-script"],
      aliases: ["test-2-alias"],
      path: "test/test-2",
    };
    const projectWithData = createMemoryProject({
      name: "test-project",
      rootDirectory: "test-project-directory",
      workspaces: [testWs1, testWs2],
    });

    expect(projectWithData.sourceType).toEqual("memory");
    expect(projectWithData.rootDirectory).toEqual("test-project-directory");
    expect(projectWithData.workspaces).toEqual([testWs1, testWs2]);
    expect(projectWithData.name).toEqual("test-project");

    expect(
      projectWithData.createScriptCommand({
        args: "",
        method: "cd",
        scriptName: "test-script",
        workspaceNameOrAlias: "test-1",
      }),
    ).toEqual({
      command: {
        cwd: path.resolve(projectWithData.rootDirectory, "test/test-1"),
        command: `bun --silent run test-script`,
      },
      scriptName: "test-script",
      workspace: testWs1,
    });

    expect(projectWithData.mapScriptsToWorkspaces()).toEqual({
      "test-script": {
        name: "test-script",
        workspaces: [testWs1, testWs2],
      },
    });

    expect(projectWithData.findWorkspaceByName("test-1")).toEqual(testWs1);
    expect(projectWithData.findWorkspaceByName("test-2")).toEqual(testWs2);
    expect(projectWithData.findWorkspaceByName("not-a-workspace")).toBeNull();

    expect(projectWithData.findWorkspaceByAlias("test-1-alias")).toBeNull();
    expect(projectWithData.findWorkspaceByAlias("test-2-alias")).toEqual(
      testWs2,
    );
    expect(projectWithData.findWorkspaceByAlias("not-a-alias")).toBeNull();

    expect(projectWithData.findWorkspaceByNameOrAlias("test-1")).toEqual(
      testWs1,
    );
    expect(projectWithData.findWorkspaceByNameOrAlias("test-2")).toEqual(
      testWs2,
    );
    expect(
      projectWithData.findWorkspaceByNameOrAlias("not-a-workspace"),
    ).toBeNull();

    expect(
      projectWithData.findWorkspaceByNameOrAlias("test-1-alias"),
    ).toBeNull();
    expect(projectWithData.findWorkspaceByNameOrAlias("test-2-alias")).toEqual(
      testWs2,
    );
    expect(
      projectWithData.findWorkspaceByNameOrAlias("not-a-alias"),
    ).toBeNull();

    expect(projectWithData.findWorkspacesByPattern("test-*")).toEqual([
      testWs1,
      testWs2,
    ]);

    expect(projectWithData.findWorkspacesByPattern("*-2")).toEqual([testWs2]);
    expect(projectWithData.findWorkspacesByPattern("not-a-pattern")).toEqual(
      [],
    );
  });
});
