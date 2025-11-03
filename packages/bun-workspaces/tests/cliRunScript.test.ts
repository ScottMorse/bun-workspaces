import { test, expect, describe } from "bun:test";
import { setupCliTest, assertOutputMatches } from "./util/cliTestUtils";

describe("CLI Run Script", () => {
  test("Running with failures", async () => {
    const { run } = setupCliTest({
      testProject: "runScriptWithFailures",
    });

    const result = await run("run-script", "test-exit");
    expect(result.exitCode).toBe(1);
    assertOutputMatches(
      result.stdoutAndErr.sanitizedCompactLines,
      `[fail1:test-exit] fail1
[fail2:test-exit] fail2
[success1:test-exit] success1
[success2:test-exit] success2
❌ fail1: test-exit (exited with code 1)
❌ fail2: test-exit (exited with code 2)
✅ success1: test-exit
✅ success2: test-exit
2 of 4 scripts failed`,
    );
    assertOutputMatches(
      result.stderr.sanitizedCompactLines,
      `[fail1:test-exit] fail1
[fail2:test-exit] fail2`,
    );
    assertOutputMatches(
      result.stdout.sanitizedCompactLines,
      `[success1:test-exit] success1
[success2:test-exit] success2
❌ fail1: test-exit (exited with code 1)
❌ fail2: test-exit (exited with code 2)
✅ success1: test-exit
✅ success2: test-exit
2 of 4 scripts failed`,
    );
  });

  test("Running with mixed output per script", async () => {
    const { run } = setupCliTest({
      testProject: "runScriptWithMixedOutput",
    });

    const result = await run("run-script", "test-exit");
    expect(result.exitCode).toBe(1);
    assertOutputMatches(
      result.stdoutAndErr.sanitizedCompactLines,
      `[fail1:test-exit] fail1 stdout 1
[fail1:test-exit] fail1 stderr 1
[fail1:test-exit] fail1 stdout 2
[fail2:test-exit] fail2 stderr 1
[fail2:test-exit] fail2 stdout 1
[fail2:test-exit] fail2 stderr 2
[success1:test-exit] success1 stdout 1
[success1:test-exit] success1 stderr 1
[success1:test-exit] success1 stdout 2
[success1:test-exit] success1 stderr 2
[success2:test-exit] success2 stderr 1
[success2:test-exit] success2 stdout 1
[success2:test-exit] success2 stderr 2
[success2:test-exit] success2 stdout 2
❌ fail1: test-exit (exited with code 1)
❌ fail2: test-exit (exited with code 1)
✅ success1: test-exit
✅ success2: test-exit
2 of 4 scripts failed`,
    );
  });

  test(
    "Running in series vs. parallel",
    async () => {
      const { run } = setupCliTest({
        testProject: "runScriptWithDelays",
      });

      const resultSeries = await run("run-script", "test-delay");
      expect(resultSeries.exitCode).toBe(0);
      assertOutputMatches(
        resultSeries.stdout.sanitizedCompactLines,
        `[fifth:test-delay] fifth
[first:test-delay] first
[fourth:test-delay] fourth
[second:test-delay] second
[third:test-delay] third
✅ fifth: test-delay
✅ first: test-delay
✅ fourth: test-delay
✅ second: test-delay
✅ third: test-delay
5 scripts ran successfully`,
      );

      const resultParallel = await run(
        "run-script",
        "test-delay",
        "--parallel",
      );
      expect(resultParallel.exitCode).toBe(0);
      assertOutputMatches(
        resultParallel.stdout.sanitizedCompactLines,
        `[first:test-delay] first
[second:test-delay] second
[third:test-delay] third
[fourth:test-delay] fourth
[fifth:test-delay] fifth
✅ fifth: test-delay
✅ first: test-delay
✅ fourth: test-delay
✅ second: test-delay
✅ third: test-delay
5 scripts ran successfully`,
      );
    },
    { repeats: 5 },
  );

  test("Run for specific workspaces", async () => {
    const { run } = setupCliTest({
      testProject: "simple1",
    });

    const resultAll = await run("run-script", "all-workspaces", "*");
    // expect(resultAll.exitCode).toBe(0);
    assertOutputMatches(
      resultAll.stdout.sanitizedCompactLines,
      `[application-1a:all-workspaces] script for all workspaces
[application-1b:all-workspaces] script for all workspaces
[library-1a:all-workspaces] script for all workspaces
[library-1b:all-workspaces] script for all workspaces
✅ application-1a: all-workspaces
✅ application-1b: all-workspaces
✅ library-1a: all-workspaces
✅ library-1b: all-workspaces
4 scripts ran successfully`,
    );

    const resultApplication = await run(
      "run-script",
      "all-workspaces",
      "application*",
    );
    expect(resultApplication.exitCode).toBe(0);
    assertOutputMatches(
      resultApplication.stdout.sanitizedCompactLines,
      `[application-1a:all-workspaces] script for all workspaces
[application-1b:all-workspaces] script for all workspaces
✅ application-1a: all-workspaces
✅ application-1b: all-workspaces
2 scripts ran successfully`,
    );

    const resultApplicationsPlusLibrary = await run(
      "run-script",
      "all-workspaces",
      "application*",
      "library-1a",
    );
    expect(resultApplicationsPlusLibrary.exitCode).toBe(0);
    assertOutputMatches(
      resultApplicationsPlusLibrary.stdout.sanitizedCompactLines,
      `[application-1a:all-workspaces] script for all workspaces
[application-1b:all-workspaces] script for all workspaces
[library-1a:all-workspaces] script for all workspaces
✅ application-1a: all-workspaces
✅ application-1b: all-workspaces
✅ library-1a: all-workspaces
3 scripts ran successfully`,
    );

    const result1a = await run("run-script", "all-workspaces", "*1a");
    expect(result1a.exitCode).toBe(0);
    assertOutputMatches(
      result1a.stdout.sanitizedCompactLines,
      `[application-1a:all-workspaces] script for all workspaces
[library-1a:all-workspaces] script for all workspaces
✅ application-1a: all-workspaces
✅ library-1a: all-workspaces
2 scripts ran successfully`,
    );

    const resultNoMatch = await run(
      "run-script",
      "all-workspaces",
      "does-not-exist*",
    );
    expect(resultNoMatch.exitCode).toBe(1);
    assertOutputMatches(
      resultNoMatch.stderr.sanitizedCompactLines,
      `No matching workspaces found with script "all-workspaces"`,
    );

    const resultAliases = await run(
      "run-script",
      "all-workspaces",
      "appB",
      "libA",
    );
    expect(resultAliases.exitCode).toBe(0);
    assertOutputMatches(
      resultAliases.stdout.sanitizedCompactLines,
      `[application-1b:all-workspaces] script for all workspaces
[library-1a:all-workspaces] script for all workspaces
✅ application-1b: all-workspaces
✅ library-1a: all-workspaces
2 scripts ran successfully`,
    );
  });
});
