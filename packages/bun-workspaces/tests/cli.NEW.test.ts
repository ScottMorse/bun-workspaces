import { test, expect, describe, mock, spyOn } from "bun:test";
import { createCli } from "../src/cli";
import type { CliProgram } from "../src/cli/createCli";
import { commandOutputLogger } from "../src/cli/projectCommands";
import { logger } from "../src/internal/logger";
import { createRawPattern } from "../src/internal/regex";
import { getProjectRoot, type TestProjectName } from "./testProjects";

interface SetupTestOptions {
  testProject?: TestProjectName;
}

interface SetupTestResult {
  cliProgram: CliProgram;
  run: (...argv: string[]) => void;
  handleErrorMock: ReturnType<typeof mock>;
  writeOutSpy: ReturnType<typeof spyOn>;
  writeCommandOutputSpy: ReturnType<typeof spyOn>;
  writeErrSpy: ReturnType<typeof spyOn>;
  assertLastWrite: (
    pattern: string | RegExp,
    logType?: "commandOutput" | "error",
  ) => void;
  assertLastErrorThrown: (error: string | RegExp | typeof Error) => void;
}

const setupTest = (
  { testProject = "default" }: SetupTestOptions = {
    testProject: "default",
  },
): SetupTestResult => {
  const handleErrorMock = mock((_error: Error) => void null);

  const writeOutSpy = spyOn(logger, "info");
  const writeCommandOutputSpy = spyOn(commandOutputLogger, "info");
  const writeErrSpy = spyOn(logger, "error");

  const testProjectRoot = getProjectRoot(testProject);

  createCli({
    handleError: handleErrorMock,
    postInit: (program) => program.exitOverride(),
    defaultCwd: testProjectRoot,
  });

  const createPattern = (pattern: string | RegExp) =>
    pattern instanceof RegExp
      ? pattern
      : new RegExp(createRawPattern(pattern), "i");

  const cliProgram = createCli({
    defaultCwd: testProjectRoot,
    postInit: (program) => program.exitOverride(),
    handleError: handleErrorMock,
  });

  return {
    cliProgram,
    handleErrorMock,
    writeOutSpy,
    writeCommandOutputSpy,
    writeErrSpy,
    assertLastWrite: (
      pattern: string | RegExp,
      logType?: "commandOutput" | "error",
    ) =>
      expect(
        (logType === "error"
          ? writeErrSpy
          : logType === "commandOutput"
            ? writeCommandOutputSpy
            : writeOutSpy
        ).mock.lastCall?.[0] ?? "",
      ).toMatch(createPattern(pattern)),
    assertLastErrorThrown: (error: string | RegExp | typeof Error) =>
      (error as typeof Error).prototype instanceof Error || error === Error
        ? expect(handleErrorMock.mock.lastCall?.[0]).toBeInstanceOf(error)
        : expect(handleErrorMock.mock.lastCall?.[0]?.message).toMatch(
            createPattern(error as string),
          ),
    run: (...argv: string[]) => {
      cliProgram.run({
        argv: [
          "bunx",
          "bun-workspaces",
          ...(argv.length === 1 ? argv[0].split(/\s+/) : argv).filter(Boolean),
        ],
      });
    },
  };
};

const USAGE_PATTERN = new RegExp(
  "^" +
    createRawPattern(`Usage: bunx bun-workspaces [options] [command]

A CLI for managing native Bun workspaces

Options:`) +
    "(.|\n)*" +
    createRawPattern(`Commands:\n`) +
    "(.|\n)*display help for command$",
  "m",
);

describe("Test CLI", () => {
  test("Help command shows", async () => {
    const { run, assertLastWrite, writeOutSpy, writeErrSpy } = setupTest();

    // await run("");
    // expect(writeOutSpy).not.toHaveBeenCalled();
    // expect(writeErrSpy).not.toHaveBeenCalled();

    await run("--help");
    expect(writeOutSpy).toBeCalledTimes(1);
    assertLastWrite(USAGE_PATTERN);
  });
});
