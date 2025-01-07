import { test as _test, expect, describe, mock } from "bun:test";
import packageJson from "../package.json";
import { CliProgram, createCliProgram } from "../src/cli/cli";
import { OUTPUT_CONFIG } from "../src/cli/output";
import { createRawPattern } from "../src/internal/regex";
import { getProjectRoot } from "./testProjects";
import { createProject, Project } from "../src/project";

const createWriteOutMock = () => mock(OUTPUT_CONFIG.writeOut);
const createWriteErrMock = () => mock(OUTPUT_CONFIG.writeErr);
const createHandleErrorMock = () => mock((_error: Error) => void 0);

interface TestContext {
  run: (...argv: string[]) => void;
  defaultProject: Project;
  cliProgram: CliProgram;
  writeOutSpy: ReturnType<typeof createWriteOutMock>;
  writeErrSpy: ReturnType<typeof createWriteErrMock>;
  handleErrorSpy: ReturnType<typeof createHandleErrorMock>;
  assertLastWrite: (pattern: string | RegExp, err?: boolean) => void;
  assertLastErrorThrown: (error: string | RegExp | typeof Error) => void;
}

const test = (name: string, fn: (context: TestContext) => void, only = false) =>
  (only ? _test.only : _test)(name, async () => {
    const writeOutSpy = createWriteOutMock();
    const writeErrSpy = createWriteErrMock();
    const handleErrorSpy = createHandleErrorMock();

    const cliProgram = createCliProgram({
      writeOut: writeOutSpy,
      writeErr: writeErrSpy,
      handleError: handleErrorSpy,
      postInit: (program) => program.exitOverride(),
      defaultCwd: getProjectRoot("default"),
    });

    const createPattern = (pattern: string | RegExp) =>
      pattern instanceof RegExp
        ? pattern
        : new RegExp(createRawPattern(pattern), "i");

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
      writeOutSpy,
      writeErrSpy,
      assertLastWrite: (pattern: string | RegExp, err = false) =>
        expect(
          (err ? writeErrSpy : writeOutSpy).mock.lastCall?.[0] ?? "",
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
  test("Help command shows", async ({
    run,
    writeOutSpy,
    writeErrSpy,
    assertLastWrite,
  }) => {
    expect(writeOutSpy).not.toHaveBeenCalled();
    expect(writeErrSpy).not.toHaveBeenCalled();

    await run("");
    expect(writeErrSpy).toBeCalledTimes(1);
    assertLastWrite("Usage", true);

    await run("--help");
    expect(writeOutSpy).toBeCalledTimes(1);
    assertLastWrite("Usage");

    await run("help");
    expect(writeOutSpy).toBeCalledTimes(2);
    assertLastWrite("Usage");

    await run("something-very-wrong");
    expect(writeErrSpy).toBeCalledTimes(2);
    assertLastWrite("Usage");
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
      assertLastWrite("application-a");
      assertLastWrite("application-b");
      assertLastWrite("library-a");
      assertLastWrite("library-b");
      assertLastWrite("library-c");

      await run("ls");
      assertLastWrite("application-a");
      assertLastWrite("application-b");
      assertLastWrite("library-a");
      assertLastWrite("library-b");
      assertLastWrite("library-c");

      await run("ls --name-only");
      assertLastWrite("application-a");
      assertLastWrite("application-b");
      assertLastWrite("library-a");
      assertLastWrite("library-b");
      assertLastWrite("library-c");

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
      );

      await run("list-workspaces --json");
      assertLastWrite(JSON.stringify(defaultProject.workspaces));

      await run("list-workspaces --json --pretty");
      assertLastWrite(JSON.stringify(defaultProject.workspaces, null, 2));
    });

    test("Using wildcard pattern", async ({ run, assertLastWrite }) => {
      await run("list-workspaces *-a");
      assertLastWrite("application-a");
      assertLastWrite("library-a");

      await run("list-workspaces *-a --name-only");
      assertLastWrite(/^\n?application-a\nlibrary-a\n?$/);

      await run("list-workspaces **b*-***b** --name-only");
      assertLastWrite(/^\n?library-b\n?$/);

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
      assertLastWrite(/^\n?application-a\n?$/);
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
      assertLastWrite("all-workspaces");
      assertLastWrite("a-workspaces");
      assertLastWrite("b-workspaces");
      assertLastWrite("c-workspaces");
      assertLastWrite("application-a");
      assertLastWrite("application-b");
      assertLastWrite("library-a");
      assertLastWrite("library-b");
      assertLastWrite("library-c");

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
      );

      const outputData = Object.values(
        defaultProject.listScriptsWithWorkspaces(),
      ).map(({ name, workspaces }) => ({
        name,
        workspaces: workspaces.map(({ name }) => name),
      }));

      await run("list-scripts --json");
      assertLastWrite(JSON.stringify(outputData));

      await run("list-scripts --json --pretty");
      assertLastWrite(JSON.stringify(outputData, null, 2));
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
      );
    });
  });

  test("workspace-info", async ({ run, assertLastWrite, defaultProject }) => {
    await run("workspace-info application-a");
    assertLastWrite(/(workspace|name): application-a/i);
    assertLastWrite("path: applications/applicationA");
    assertLastWrite("match: applications/*");
    assertLastWrite("scripts: a-workspaces, all-workspaces, application-a");

    await run("workspace-info library-a");
    assertLastWrite(/(workspace|name): library-a/i);
    assertLastWrite("path: libraries/libraryA");
    assertLastWrite("match: libraries/**/*");
    assertLastWrite("scripts: a-workspaces, all-workspaces, library-a");

    await run("workspace-info application-b --json");
    assertLastWrite(
      JSON.stringify({
        ...defaultProject.findWorkspaceByName("application-b"),
      }),
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
    );
  });

  describe("script-info", () => {
    test("Default project", async ({
      run,
      assertLastWrite,
      defaultProject,
    }) => {
      await run("script-info all-workspaces");
      assertLastWrite(/(script|name): all-workspaces/i);
      assertLastWrite("application-a");
      assertLastWrite("application-a");
      assertLastWrite("library-a");
      assertLastWrite("library-b");
      assertLastWrite("library-c");

      await run("script-info a-workspaces --workspaces-only");
      assertLastWrite(
        new RegExp(
          "^\n?" + ["application-a", "library-a"].join("\n") + "\n?$",
          "i",
        ),
      );

      const outputData = {
        ...defaultProject.listScriptsWithWorkspaces()["b-workspaces"],
        workspaces: defaultProject
          .listWorkspacesWithScript("b-workspaces")
          .map(({ name }) => name),
      };

      await run("script-info b-workspaces --json");
      assertLastWrite(JSON.stringify(outputData));

      await run("script-info b-workspaces --json --pretty");
      assertLastWrite(JSON.stringify(outputData, null, 2));
    });

    test("No script found", async ({ run, assertLastWrite }) => {
      await run("script-info not-found");
      assertLastWrite("Script not found");
    });
  });

  describe("run", () => {
    test("Valid commands", async ({ run, handleErrorSpy, writeErrSpy }) => {
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
      assertLastWrite('No workspaces found for script "not-found"', true);

      await run("run not-found *not-found*");
      assertLastWrite(
        'No matching workspaces found for script "not-found"',
        true,
      );

      await run("run all-workspaces not-found");
      assertLastWrite('Workspace not found: "not-found"', true);

      await run("run b-workspaces *-a");
      assertLastWrite(
        'No matching workspaces found for script "b-workspaces"',
        true,
      );
    });
  });
});
