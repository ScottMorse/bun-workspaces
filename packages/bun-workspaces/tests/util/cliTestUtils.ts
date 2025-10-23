import { expect, mock, spyOn } from "bun:test";
import { createCli } from "../../src/cli";
import type { CliProgram } from "../../src/cli/createCli";
import type { CliGlobalOptionName } from "../../src/cli/globalOptions";
import { getCliGlobalOptionNames } from "../../src/cli/globalOptions/globalOptionsConfig";
import {
  commandOutputLogger,
  getCliProjectCommandNames,
  type CliProjectCommandName,
} from "../../src/cli/projectCommands";
import { logger } from "../../src/internal/logger";
import { createRawPattern } from "../../src/internal/regex";
import { getProjectRoot, type TestProjectName } from "../testProjects";

interface SetupTestOptions {
  testProject?: TestProjectName;
}

const acknowledgedGlobalOptionTests: Record<string, boolean> = {};
export const acknowledgeGlobalOptionTest = (option: CliGlobalOptionName) => {
  acknowledgedGlobalOptionTests[option] = true;
};

export const validateAllGlobalOptionTests = () => {
  for (const option of getCliGlobalOptionNames()) {
    if (!acknowledgedGlobalOptionTests[option]) {
      throw new Error(`Test for global option ${option} was not acknowledged`);
    }
  }
};

const acknowledgedCommandTests: Record<string, boolean> = {};
export const acknowledgeCommandTest = (command: CliProjectCommandName) => {
  acknowledgedCommandTests[command] = true;
};

export const validateAllCommandsTests = () => {
  for (const command of getCliProjectCommandNames()) {
    if (!acknowledgedCommandTests[command]) {
      throw new Error(`Test for command ${command} was not acknowledged`);
    }
  }
};

interface SetupCliTestResult {
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

export const setupCliTest = (
  { testProject = "default" }: SetupTestOptions = {
    testProject: "default",
  },
): SetupCliTestResult => {
  const handleErrorMock = mock((_error: Error) => void null);

  const writeOutSpy = spyOn(logger, "info");
  const writeCommandOutputSpy = spyOn(commandOutputLogger, "info");
  const writeErrSpy = spyOn(logger, "error");

  writeOutSpy.mockReset();
  writeCommandOutputSpy.mockReset();
  writeErrSpy.mockReset();

  const testProjectRoot = getProjectRoot(testProject);

  createCli({
    handleError: handleErrorMock,
    postInit: (program) => program.exitOverride(),
    defaultCwd: testProjectRoot,
  });

  const createPattern = (pattern: string | RegExp) =>
    pattern instanceof RegExp
      ? pattern
      : new RegExp("^" + createRawPattern(pattern.trim()) + "$", "i");

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

export const USAGE_OUTPUT_PATTERN = new RegExp(
  "^" +
    createRawPattern(`Usage: bunx bun-workspaces [options] [command]

A CLI for managing native Bun workspaces

Options:`) +
    "(.|\n)*" +
    createRawPattern(`Commands:\n`) +
    "(.|\n)*display help for command$",
  "m",
);
