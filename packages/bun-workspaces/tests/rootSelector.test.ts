import path from "node:path";
import { describe, expect, test } from "bun:test";
import { createFileSystemProject } from "../src";
import { getProjectRoot } from "./testProjects";
import { setupCliTest } from "./util/cliTestUtils";

describe("Test root selector", () => {
  test("API - Root selector: findWorkspacesByPattern", () => {
    const projectNoRoot = createFileSystemProject({
      rootDirectory: getProjectRoot("withRootWorkspace"),
      includeRootWorkspace: false,
    });

    expect(projectNoRoot.findWorkspacesByPattern("@root")).toEqual([
      projectNoRoot.rootWorkspace,
    ]);

    // should be able to reference even when not included
    expect(
      projectNoRoot.findWorkspacesByPattern("application-*", "@root"),
    ).toEqual([
      projectNoRoot.rootWorkspace,
      projectNoRoot.findWorkspaceByName("application-1a")!,
      projectNoRoot.findWorkspaceByName("application-1b")!,
    ]);

    // works with included workspace too
    const projectWithRoot = createFileSystemProject({
      rootDirectory: getProjectRoot("withRootWorkspace"),
      includeRootWorkspace: true,
    });

    expect(projectWithRoot.findWorkspacesByPattern("@root")).toEqual([
      projectWithRoot.rootWorkspace,
    ]);
  });

  test("API - Root selector: createScriptCommand", () => {
    const project = createFileSystemProject({
      rootDirectory: getProjectRoot("withRootWorkspace"),
    });

    expect(
      project.createScriptCommand({
        workspaceNameOrAlias: "@root",
        scriptName: "root-workspace",
      }),
    ).toEqual({
      commandDetails: {
        workingDirectory: path.resolve(project.rootDirectory),
        command: "bun --silent run root-workspace",
      },
      scriptName: "root-workspace",
      workspace: project.rootWorkspace,
    });
  });

  test("CLI - Root selector: workspace-info", async () => {
    const { run } = setupCliTest({
      testProject: "withRootWorkspace",
    });

    const result = await run("--no-include-root", "workspace-info", "@root");
    expect(result.exitCode).toBe(0);
    expect(result.stdout.raw).toContain(
      `Workspace: test-root (root)
 - Aliases: my-root-alias
 - Path: 
 - Glob Match: 
 - Scripts: all-workspaces, root-workspace`,
    );
  });

  test("CLI - Root selector: run-script", async () => {
    const { run } = setupCliTest({
      testProject: "withRootWorkspace",
    });

    const result = await run(
      "--no-include-root",
      "run-script",
      "root-workspace",
      "@root",
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout.sanitizedCompactLines).toContain(
      `[test-root:root-workspace] script for root workspace
✅ test-root: root-workspace
1 script ran successfully`,
    );
  });
});
