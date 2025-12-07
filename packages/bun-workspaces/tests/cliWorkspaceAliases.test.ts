import { test, expect, describe } from "bun:test";
import { setupCliTest, assertOutputMatches } from "./util/cliTestUtils";

describe("CLI Workspace Aliases", () => {
  test("Aliases in workspace info", async () => {
    const { run } = setupCliTest({
      testProject: "workspaceConfigPackageFileMix",
    });

    const result1 = await run("workspace-info", "appA");
    expect(result1.exitCode).toBe(0);
    assertOutputMatches(
      result1.stdout.raw,
      `Workspace: application-1a
 - Aliases: appA
 - Path: applications/application-a
 - Glob Match: applications/*
 - Scripts: a-workspaces, all-workspaces, application-a`,
    );

    const result2 = await run("workspace-info", "appB_file");
    expect(result2.exitCode).toBe(0);
    assertOutputMatches(
      result2.stdout.raw,
      `Workspace: application-1b
 - Aliases: appB_file
 - Path: applications/application-b
 - Glob Match: applications/*
 - Scripts: all-workspaces, application-b, b-workspaces`,
    );

    const result3 = await run("workspace-info", "application-1a");
    expect(result3.exitCode).toBe(0);
    assertOutputMatches(
      result3.stdout.raw,
      `Workspace: application-1a
 - Aliases: appA
 - Path: applications/application-a
 - Glob Match: applications/*
 - Scripts: a-workspaces, all-workspaces, application-a`,
    );
  });

  test("Aliases in workspace info (with deprecated config)", async () => {
    const { run } = setupCliTest({
      testProject: "workspaceConfigDeprecatedConfigMix",
    });

    const result1 = await run("workspace-info", "deprecated_appA");
    expect(result1.exitCode).toBe(0);
    assertOutputMatches(
      result1.stdout.raw,
      `Workspace: application-1a
 - Aliases: deprecated_appA, appA
 - Path: applications/application-a
 - Glob Match: applications/*
 - Scripts: a-workspaces, all-workspaces, application-a`,
    );

    const result2 = await run("workspace-info", "appB_file");
    expect(result2.exitCode).toBe(0);
    assertOutputMatches(
      result2.stdout.raw,
      `Workspace: application-1b
 - Aliases: deprecated_appB, appB_file
 - Path: applications/application-b
 - Glob Match: applications/*
 - Scripts: all-workspaces, application-b, b-workspaces`,
    );

    const result3 = await run("workspace-info", "application-1a");
    expect(result3.exitCode).toBe(0);
    assertOutputMatches(
      result3.stdout.raw,
      `Workspace: application-1a
 - Aliases: deprecated_appA, appA
 - Path: applications/application-a
 - Glob Match: applications/*
 - Scripts: a-workspaces, all-workspaces, application-a`,
    );
  });

  test("Aliases in run-script", async () => {
    const { run } = setupCliTest({
      testProject: "workspaceConfigPackageFileMix",
    });

    const result = await run("run-script", "all-workspaces", "appA");
    expect(result.exitCode).toBe(0);
    assertOutputMatches(
      result.stdout.sanitizedCompactLines,
      `[application-1a:all-workspaces] script for all workspaces
✅ application-1a: all-workspaces
1 script ran successfully`,
    );

    const result2 = await run(
      "run-script",
      "b-workspaces",
      "appB_file",
      "library-1b",
    );
    expect(result2.exitCode).toBe(0);
    assertOutputMatches(
      result2.stdout.sanitizedCompactLines,
      `[application-1b:b-workspaces] script for b workspaces
[library-1b:b-workspaces] script for b workspaces
✅ application-1b: b-workspaces
✅ library-1b: b-workspaces
2 scripts ran successfully`,
    );

    const result3 = await run(
      "run-script",
      "all-workspaces",
      "libA_file",
      "application-*",
    );
    expect(result3.exitCode).toBe(0);
    assertOutputMatches(
      result3.stdout.sanitizedCompactLines,
      `[application-1b:all-workspaces] script for all workspaces
[application-1a:all-workspaces] script for all workspaces
[application-1c:all-workspaces] script for all workspaces
[library-1a:all-workspaces] script for all workspaces
✅ application-1b: all-workspaces
✅ application-1a: all-workspaces
✅ application-1c: all-workspaces
✅ library-1a: all-workspaces
4 scripts ran successfully`,
    );
  });
});
