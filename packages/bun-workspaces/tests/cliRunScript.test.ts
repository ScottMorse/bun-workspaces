import fs from "fs";
import path from "path";
import { test, expect, describe, beforeAll } from "bun:test";
import { setupCliTest, assertOutputMatches } from "./util/cliTestUtils";
import { getProjectRoot, type TestProjectName } from "./testProjects";

const TEST_OUTPUT_DIR = path.resolve(__dirname, "test-output");

describe("CLI Run Script", () => {
  beforeAll(() => {
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

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

  test("Using --args", async () => {
    const { run } = setupCliTest({
      testProject: "runScriptWithEchoArgs",
    });
    const result = await run("run-script", "test-echo", "--args=test-args");
    expect(result.exitCode).toBe(0);
    assertOutputMatches(
      result.stdoutAndErr.sanitizedCompactLines,
      `[application-1a:test-echo] passed args: test-args
[application-1b:test-echo] passed args: test-args
[library-1a:test-echo] passed args: test-args
[library-1b:test-echo] passed args: test-args
✅ application-1a: test-echo
✅ application-1b: test-echo
✅ library-1a: test-echo
✅ library-1b: test-echo
4 scripts ran successfully`,
    );

    const result2 = await run(
      "run-script",
      "test-echo",
      "--args=hello there <workspace>",
    );
    expect(result2.exitCode).toBe(0);
    assertOutputMatches(
      result2.stdoutAndErr.sanitizedCompactLines,
      `[application-1a:test-echo] passed args: hello there application-1a
[application-1b:test-echo] passed args: hello there application-1b
[library-1a:test-echo] passed args: hello there library-1a
[library-1b:test-echo] passed args: hello there library-1b
✅ application-1a: test-echo
✅ application-1b: test-echo
✅ library-1a: test-echo
✅ library-1b: test-echo
4 scripts ran successfully`,
    );

    const result3 = await run(
      "run-script",
      "test-echo",
      "--args=<workspace> and <workspace> and <workspace>",
    );
    expect(result3.exitCode).toBe(0);
    assertOutputMatches(
      result3.stdoutAndErr.sanitizedCompactLines,
      `[application-1a:test-echo] passed args: application-1a and application-1a and application-1a
[application-1b:test-echo] passed args: application-1b and application-1b and application-1b
[library-1a:test-echo] passed args: library-1a and library-1a and library-1a
[library-1b:test-echo] passed args: library-1b and library-1b and library-1b
✅ application-1a: test-echo
✅ application-1b: test-echo
✅ library-1a: test-echo
✅ library-1b: test-echo
4 scripts ran successfully`,
    );

    const result4 = await run(
      "run-script",
      "test-echo",
      "appA",
      "libB",
      "--args=for workspace <workspace>",
    );
    expect(result4.exitCode).toBe(0);
    assertOutputMatches(
      result4.stdoutAndErr.sanitizedCompactLines,
      `[application-1a:test-echo] passed args: for workspace application-1a
[library-1b:test-echo] passed args: for workspace library-1b
✅ application-1a: test-echo
✅ library-1b: test-echo
2 scripts ran successfully`,
    );
  });

  test("Using --no-prefix", async () => {
    const result = await setupCliTest({
      testProject: "simple1",
    }).run("run-script", "all-workspaces", "--no-prefix");
    expect(result.exitCode).toBe(0);
    assertOutputMatches(
      result.stdoutAndErr.sanitizedCompactLines,
      `script for all workspaces
script for all workspaces
script for all workspaces
script for all workspaces
✅ application-1a: all-workspaces
✅ application-1b: all-workspaces
✅ library-1a: all-workspaces
✅ library-1b: all-workspaces
4 scripts ran successfully`,
    );

    const resultFailures = await setupCliTest({
      testProject: "runScriptWithFailures",
    }).run("run-script", "test-exit", "--no-prefix");

    expect(resultFailures.exitCode).toBe(1);
    assertOutputMatches(
      resultFailures.stdoutAndErr.sanitizedCompactLines,
      `fail1
fail2
success1
success2
❌ fail1: test-exit (exited with code 1)
❌ fail2: test-exit (exited with code 2)
✅ success1: test-exit
✅ success2: test-exit
2 of 4 scripts failed`,
    );
  });

  test("JSON output - errors with output path", async () => {
    const { run } = setupCliTest({
      testProject: "simple1",
    });

    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });

    const result = await run(
      "run-script",
      "all-workspaces",
      `--json-outfile=${TEST_OUTPUT_DIR}`,
    );
    expect(result.exitCode).toBe(1);
    assertOutputMatches(
      result.stderr.sanitizedCompactLines,
      `Given JSON output file path "${TEST_OUTPUT_DIR}" is an existing directory`,
    );

    fs.writeFileSync(TEST_OUTPUT_DIR + "/test-file.txt", "test file");
    const result2 = await run(
      "run-script",
      "all-workspaces",
      "--json-outfile",
      TEST_OUTPUT_DIR + "/test-file.txt/test-file.json",
    );
    expect(result2.exitCode).toBe(1);
    assertOutputMatches(
      result2.stderr.sanitizedCompactLines,
      `Given JSON output file directory "${TEST_OUTPUT_DIR}/test-file.txt" is an existing file`,
    );

    const result3 = await run(
      "run-script",
      "all-workspaces",
      "--json-outfile",
      TEST_OUTPUT_DIR + "/test-file.txt/something/else.json",
    );
    expect(result3.exitCode).toBe(1);
    assertOutputMatches(
      result3.stderr.sanitizedCompactLines,
      `Failed to create JSON output file directory "${TEST_OUTPUT_DIR}/test-file.txt/something": Error: ENOTDIR: not a directory, mkdir '${TEST_OUTPUT_DIR}/test-file.txt/something'`,
    );
  });

  const runAndGetJsonOutput = async (
    testProject: TestProjectName,
    outputPath: string,
    ...args: string[]
  ) => {
    const { run } = setupCliTest({ testProject });
    const fullOutputPath = path.resolve(TEST_OUTPUT_DIR, outputPath);
    const result = await run(
      "run-script",
      ...args,
      "--json-outfile",
      fullOutputPath,
    );
    return {
      result,
      json: JSON.parse(fs.readFileSync(fullOutputPath, "utf8")),
    };
  };

  test("JSON output file - all success", async () => {
    const { json: jsonOutput1 } = await runAndGetJsonOutput(
      "simple1",
      "test-simple1.json",
      "all-workspaces",
      '--args="test args"',
    );
    expect(jsonOutput1).toEqual({
      script: "all-workspaces",
      args: '"test args"',
      totalCount: 4,
      parallel: false,
      successCount: 4,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      workspaces: [
        {
          workspace: {
            name: "application-1a",
            path: "applications/applicationA",
            aliases: ["appA"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
        {
          workspace: {
            name: "application-1b",
            path: "applications/applicationB",
            aliases: ["appB"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
        {
          workspace: {
            name: "library-1a",
            path: "libraries/libraryA",
            aliases: ["libA"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
        {
          workspace: {
            name: "library-1b",
            path: "libraries/libraryB",
            aliases: ["libB"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
      ],
    });
    for (const { startTimeISO, endTimeISO, durationMs } of [
      jsonOutput1,
      ...jsonOutput1.workspaces,
    ]) {
      expect(startTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(endTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(durationMs).toBe(
        new Date(endTimeISO).getTime() - new Date(startTimeISO).getTime(),
      );
    }

    const { json: jsonOutput2 } = await runAndGetJsonOutput(
      "simple1",
      "test-simple2.json",
      "a-workspaces",
      "--args=my-args",
    );
    expect(jsonOutput2).toEqual({
      script: "a-workspaces",
      args: "my-args",
      parallel: false,
      totalCount: 2,
      successCount: 2,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      workspaces: [
        {
          workspace: {
            name: "application-1a",
            path: "applications/applicationA",
            aliases: ["appA"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
        {
          workspace: {
            name: "library-1a",
            path: "libraries/libraryA",
            aliases: ["libA"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
      ],
    });

    for (const { startTimeISO, endTimeISO, durationMs } of [
      jsonOutput2,
      ...jsonOutput2.workspaces,
    ]) {
      expect(startTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(endTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(durationMs).toBe(
        new Date(endTimeISO).getTime() - new Date(startTimeISO).getTime(),
      );
    }

    const { json: jsonOutput3 } = await runAndGetJsonOutput(
      "simple1",
      "test-simple3.json",
      "b-workspaces",
      "--parallel",
      "library*",
    );
    expect(jsonOutput3).toEqual({
      script: "b-workspaces",
      args: "",
      parallel: true,
      totalCount: 1,
      successCount: 1,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      workspaces: [
        {
          workspace: {
            name: "library-1b",
            path: "libraries/libraryB",
            aliases: ["libB"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
      ],
    });

    for (const { startTimeISO, endTimeISO, durationMs } of [
      jsonOutput3,
      ...jsonOutput3.workspaces,
    ]) {
      expect(startTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(endTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(durationMs).toBe(
        new Date(endTimeISO).getTime() - new Date(startTimeISO).getTime(),
      );
    }
  });

  test("JSON output file - mixed results", async () => {
    const { json } = await runAndGetJsonOutput(
      "runScriptWithFailures",
      "test-mixed-results.json",
      "test-exit",
      "--parallel",
    );

    expect(json).toEqual({
      script: "test-exit",
      args: "",
      parallel: true,
      totalCount: 4,
      successCount: 2,
      failureCount: 2,
      allSuccess: false,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      workspaces: [
        {
          workspace: {
            name: "fail1",
            path: "packages/fail1",
            aliases: [],
          },
          success: false,
          exitCode: 1,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
        {
          workspace: {
            name: "fail2",
            path: "packages/fail2",
            aliases: [],
          },
          success: false,
          exitCode: 2,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
        {
          workspace: {
            name: "success1",
            path: "packages/success1",
            aliases: [],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
        {
          workspace: {
            name: "success2",
            path: "packages/success2",
            aliases: [],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
      ],
    });

    for (const { startTimeISO, endTimeISO, durationMs } of [
      json,
      ...json.workspaces,
    ]) {
      expect(startTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(endTimeISO).toStartWith(new Date().toISOString().slice(0, 10));
      expect(durationMs).toBe(
        new Date(endTimeISO).getTime() - new Date(startTimeISO).getTime(),
      );
    }
  });

  test("JSON output file - relative path with --cwd global option", async () => {
    const { run } = setupCliTest({
      testProject: "simple1",
    });

    const result = await run(
      "--cwd",
      getProjectRoot("simple1"),
      "run-script",
      "application-a",
      "--args=test-args",
      "--json-outfile",
      "test-output/results.json", // for gitignore
    );

    expect(result.exitCode).toBe(0);
    expect(
      JSON.parse(
        fs.readFileSync(
          path.resolve(getProjectRoot("simple1"), "test-output/results.json"),
          "utf8",
        ),
      ),
    ).toEqual({
      script: "application-a",
      args: "test-args",
      parallel: false,
      totalCount: 1,
      successCount: 1,
      failureCount: 0,
      allSuccess: true,
      startTimeISO: expect.any(String),
      endTimeISO: expect.any(String),
      durationMs: expect.any(Number),
      workspaces: [
        {
          workspace: {
            name: "application-1a",
            path: "applications/applicationA",
            aliases: ["appA"],
          },
          success: true,
          exitCode: 0,
          startTimeISO: expect.any(String),
          endTimeISO: expect.any(String),
          durationMs: expect.any(Number),
        },
      ],
    });
  });
});
