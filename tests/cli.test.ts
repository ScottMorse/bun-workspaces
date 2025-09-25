import { test as _test, expect, describe, mock, spyOn } from "bun:test";
import packageJson from "../package.json";
import { CliProgram, createCliProgram } from "../src/cli/cli";
import { commandOutputLogger } from "../src/cli/projectCommands";
import { logger } from "../src/internal/logger";
import { createRawPattern } from "../src/internal/regex";
import { createProject, Project } from "../src/project";
import { getProjectRoot } from "./testProjects";

const createHandleErrorMock = () => mock((_error: Error) => void 0);

const writeOutSpy = spyOn(logger, "info");
const writeCommandOutputSpy = spyOn(commandOutputLogger, "info");
const writeErrSpy = spyOn(logger, "error");

interface TestContext {
  run: (...argv: string[]) => void;
  defaultProject: Project;
  cliProgram: CliProgram;
  handleErrorSpy: ReturnType<typeof createHandleErrorMock>;
  assertLastWrite: (
    pattern: string | RegExp,
    logType?: "commandOutput" | "error",
  ) => void;
  assertLastErrorThrown: (error: string | RegExp | typeof Error) => void;
}

const test = (name: string, fn: (context: TestContext) => void, only = false) =>
  (only ? _test.only : _test)(name, async () => {
    const handleErrorSpy = createHandleErrorMock();

    const cliProgram = createCliProgram({
      handleError: handleErrorSpy,
      postInit: (program) => program.exitOverride(),
      defaultCwd: getProjectRoot("default"),
    });

    const createPattern = (pattern: string | RegExp) =>
      pattern instanceof RegExp
        ? pattern
        : new RegExp(createRawPattern(pattern), "i");

    handleErrorSpy.mockReset();
    writeOutSpy.mockReset();
    writeCommandOutputSpy.mockReset();
    writeErrSpy.mockReset();

    await fn({
      run: (...argv: string[]) => {
        cliProgram.run({
          argv: [
            "bunx",
            "bun-workspaces",
            ...(argv.length === 1 ? argv[0].split(/\s+/) : argv).filter(
              Boolean,
            ),
          ],
        });
      },
      defaultProject: createProject({
        rootDir: getProjectRoot("default"),
      }),
      handleErrorSpy,
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
        (error as typeof Error).prototype instanceof Error
          ? expect(handleErrorSpy.mock.lastCall?.[0]).toBeInstanceOf(error)
          : expect(handleErrorSpy.mock.lastCall?.[0]?.message).toMatch(
              createPattern(error as string),
            ),
      cliProgram,
    });
  });

describe("Test CLI", () => {
  test("Help command shows", async ({ run, assertLastWrite }) => {
    expect(writeOutSpy).not.toHaveBeenCalled();
    expect(writeErrSpy).not.toHaveBeenCalled();

    await run("");
    expect(writeOutSpy).toBeCalledTimes(1);
    assertLastWrite("Usage");

    await run("--help");
    expect(writeOutSpy).toBeCalledTimes(2);
    assertLastWrite("Usage");

    await run("help");
    expect(writeOutSpy).toBeCalledTimes(3);
    assertLastWrite("Usage");

    await run("something-very-wrong");
    expect(writeErrSpy).toBeCalledTimes(1);
    assertLastWrite(/unknown command/, "error");
  });

  test("Version command shows", async ({ run, assertLastWrite }) => {
    await run("--version");
    assertLastWrite(packageJson.version);

    await run("-V");
    assertLastWrite(packageJson.version);
  });

  describe("list-workspaces", () => {
    test("Default project", async ({
      run,
      assertLastWrite,
      defaultProject,
    }) => {
      await run("list-workspaces");
      assertLastWrite("application-a", "commandOutput");
      assertLastWrite("application-b", "commandOutput");
      assertLastWrite("library-a", "commandOutput");
      assertLastWrite("library-b", "commandOutput");
      assertLastWrite("library-c", "commandOutput");

      await run("ls");
      assertLastWrite("application-a", "commandOutput");
      assertLastWrite("application-b", "commandOutput");
      assertLastWrite("library-a", "commandOutput");
      assertLastWrite("library-b", "commandOutput");
      assertLastWrite("library-c", "commandOutput");

      await run("ls --name-only");
      assertLastWrite("application-a", "commandOutput");
      assertLastWrite("application-b", "commandOutput");
      assertLastWrite("library-a", "commandOutput");
      assertLastWrite("library-b", "commandOutput");
      assertLastWrite("library-c", "commandOutput");

      await run("list-workspaces --name-only");
      assertLastWrite(
        new RegExp(
          "^\n?" +
            [
              "application-a",
              "application-b",
              "library-a",
              "library-b",
              "library-c",
            ].join("\n") +
            "\n?$",
        ),
        "commandOutput",
      );

      await run("list-workspaces *-b --name-only");
      assertLastWrite(
        new RegExp("^\n?" + ["application-b", "library-b"].join("\n") + "\n?$"),
        "commandOutput",
      );

      await run("list-workspaces --json --name-only");
      assertLastWrite(
        JSON.stringify([
          "application-a",
          "application-b",
          "library-a",
          "library-b",
          "library-c",
        ]),
        "commandOutput",
      );

      await run("list-workspaces library-* --json --name-only");
      assertLastWrite(
        JSON.stringify(["library-a", "library-b", "library-c"]),
        "commandOutput",
      );

      await run("list-workspaces --json");
      assertLastWrite(
        JSON.stringify(defaultProject.workspaces),
        "commandOutput",
      );

      await run("list-workspaces --json --pretty");
      assertLastWrite(
        JSON.stringify(defaultProject.workspaces, null, 2),
        "commandOutput",
      );
    });

    test("Using wildcard pattern", async ({ run, assertLastWrite }) => {
      await run("list-workspaces *-a");
      assertLastWrite("application-a", "commandOutput");
      assertLastWrite("library-a", "commandOutput");

      await run("list-workspaces *-a --name-only");
      assertLastWrite(/^\n?application-a\nlibrary-a\n?$/, "commandOutput");

      await run("list-workspaces **b*-***b** --name-only");
      assertLastWrite(/^\n?library-b\n?$/, "commandOutput");

      await run("list-workspaces bad-wrong-stuff");
      assertLastWrite("No workspaces found");
    });

    test("Empty project", async ({ run, assertLastWrite }) => {
      await run("--cwd", getProjectRoot("emptyWorkspaces"), "list-workspaces");
      assertLastWrite("No workspaces found");
    });

    test("One workspace", async ({ run, assertLastWrite }) => {
      await run(
        "--cwd",
        getProjectRoot("oneWorkspace"),
        "list-workspaces",
        "--name-only",
      );
      assertLastWrite(/^\n?application-a\n?$/, "commandOutput");
    });
  });

  describe("Invalid project", () => {
    // Validating issues thrown by the core project code are handled
    test("No package.json", async ({ run, assertLastErrorThrown }) => {
      await run(
        "--cwd",
        getProjectRoot("invalidNoPackageJson"),
        "list-workspaces",
      );
      assertLastErrorThrown("No package.json found");
    });

    test("Invalid package.json", async ({ run, assertLastErrorThrown }) => {
      await run("--cwd", getProjectRoot("invalidBadJson"), "list-workspaces");
      assertLastErrorThrown("package.json to be an object");
    });

    test("Duplicate workspace name", async ({ run, assertLastErrorThrown }) => {
      await run(
        "--cwd",
        getProjectRoot("invalidDuplicateName"),
        "list-workspaces",
      );
      assertLastErrorThrown("Duplicate workspace");
    });
  });

  describe("List scripts", () => {
    test("Default project", async ({
      run,
      assertLastWrite,
      defaultProject,
    }) => {
      await run("list-scripts");
      assertLastWrite("all-workspaces", "commandOutput");
      assertLastWrite("a-workspaces", "commandOutput");
      assertLastWrite("b-workspaces", "commandOutput");
      assertLastWrite("c-workspaces", "commandOutput");
      assertLastWrite("application-a", "commandOutput");
      assertLastWrite("application-b", "commandOutput");
      assertLastWrite("library-a", "commandOutput");
      assertLastWrite("library-b", "commandOutput");
      assertLastWrite("library-c", "commandOutput");

      await run("list-scripts --name-only");
      assertLastWrite(
        new RegExp(
          "^\n?" +
            [
              "a-workspaces",
              "all-workspaces",
              "application-a",
              "application-b",
              "b-workspaces",
              "c-workspaces",
              "library-a",
              "library-b",
              "library-c",
            ].join("\n") +
            "\n?$",
        ),
        "commandOutput",
      );

      await run("list-scripts --json --name-only");
      assertLastWrite(
        JSON.stringify([
          "a-workspaces",
          "all-workspaces",
          "application-a",
          "application-b",
          "b-workspaces",
          "c-workspaces",
          "library-a",
          "library-b",
          "library-c",
        ]),
        "commandOutput",
      );

      const outputData = Object.values(
        defaultProject.listScriptsWithWorkspaces(),
      ).map(({ name, workspaces }) => ({
        name,
        workspaces: workspaces.map(({ name }) => name),
      }));

      await run("list-scripts --json");
      assertLastWrite(JSON.stringify(outputData), "commandOutput");

      await run("list-scripts --json --pretty");
      assertLastWrite(JSON.stringify(outputData, null, 2), "commandOutput");
    });

    test("Empty project", async ({ run, assertLastWrite }) => {
      await run("--cwd", getProjectRoot("emptyWorkspaces"), "list-scripts");
      assertLastWrite("No scripts found");
    });

    test("One workspace", async ({ run, assertLastWrite }) => {
      await run(
        "--cwd",
        getProjectRoot("oneWorkspace"),
        "list-scripts",
        "--name-only",
      );
      assertLastWrite(
        new RegExp(
          "^\n?" +
            ["a-workspaces", "all-workspaces", "application-a"].join("\n") +
            "\n?$",
        ),
        "commandOutput",
      );
    });
  });

  test("workspace-info", async ({ run, assertLastWrite, defaultProject }) => {
    await run("workspace-info application-a");
    assertLastWrite(/(workspace|name): application-a/i, "commandOutput");
    assertLastWrite("path: applications/applicationA", "commandOutput");
    assertLastWrite("match: applications/*", "commandOutput");
    assertLastWrite(
      "scripts: a-workspaces, all-workspaces, application-a",
      "commandOutput",
    );

    await run("workspace-info library-a");
    assertLastWrite(/(workspace|name): library-a/i, "commandOutput");
    assertLastWrite("path: libraries/libraryA", "commandOutput");
    assertLastWrite("match: libraries/**/*", "commandOutput");
    assertLastWrite(
      "scripts: a-workspaces, all-workspaces, library-a",
      "commandOutput",
    );

    await run("workspace-info application-b --json");
    assertLastWrite(
      JSON.stringify({
        ...defaultProject.findWorkspaceByName("application-b"),
      }),
      "commandOutput",
    );

    await run("workspace-info library-b --json --pretty");
    assertLastWrite(
      JSON.stringify(
        {
          ...defaultProject.findWorkspaceByName("library-b"),
        },
        null,
        2,
      ),
      "commandOutput",
    );
  });

  describe("script-info", () => {
    test("Default project", async ({
      run,
      assertLastWrite,
      defaultProject,
    }) => {
      await run("script-info all-workspaces");
      assertLastWrite(/(script|name): all-workspaces/i, "commandOutput");
      assertLastWrite("application-a", "commandOutput");
      assertLastWrite("application-a", "commandOutput");
      assertLastWrite("library-a", "commandOutput");
      assertLastWrite("library-b", "commandOutput");
      assertLastWrite("library-c", "commandOutput");

      await run("script-info a-workspaces --workspaces-only");
      assertLastWrite(
        new RegExp(
          "^\n?" + ["application-a", "library-a"].join("\n") + "\n?$",
          "i",
        ),
        "commandOutput",
      );

      const outputData = {
        ...defaultProject.listScriptsWithWorkspaces()["b-workspaces"],
        workspaces: defaultProject
          .listWorkspacesWithScript("b-workspaces")
          .map(({ name }) => name),
      };

      await run("script-info b-workspaces --json");
      assertLastWrite(JSON.stringify(outputData), "commandOutput");

      await run("script-info b-workspaces --json --pretty");
      assertLastWrite(JSON.stringify(outputData, null, 2), "commandOutput");
    });

    test("No script found", async ({ run, assertLastWrite }) => {
      await run("script-info not-found");
      assertLastWrite("Script not found", "error");
    });
  });

  describe("run", () => {
    test("Valid commands", async ({ run, handleErrorSpy }) => {
      await run("run all-workspaces");
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();

      await run("run all-workspaces application-a");
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();

      await run("run all-workspaces library-a");
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();

      await run("run all-workspaces application-a library-a");
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();

      await run("run b-workspaces application-b library-b");
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();

      await run("run b-workspaces application-b library-b --parallel");
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();

      await run("run b-workspaces *-b");
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();

      await run(
        "run",
        "b-workspaces",
        "application-b",
        "library-b",
        "--args",
        '"--my --args"',
      );
      expect(handleErrorSpy).not.toBeCalled();
      expect(writeErrSpy).not.toBeCalled();
    });

    test("Invalid commands", async ({ run, assertLastWrite }) => {
      await run("run not-found");
      assertLastWrite('No workspaces found for script "not-found"', "error");

      await run("run not-found *not-found*");
      assertLastWrite(
        'No matching workspaces found for script "not-found"',
        "error",
      );

      await run("run all-workspaces not-found");
      assertLastWrite('Workspace not found: "not-found"', "error");

      await run("run b-workspaces *-a");
      assertLastWrite(
        'No matching workspaces found for script "b-workspaces"',
        "error",
      );
    });
  });
});
