import path from "node:path";
import { test, expect, describe } from "bun:test";
import { logger } from "../src/internal/logger";
import { getProjectRoot } from "./testProjects";
import {
  acknowledgeGlobalOptionTest,
  setupCliTest,
  USAGE_OUTPUT_PATTERN,
  validateAllGlobalOptionTests,
} from "./util/cliTestUtils";

describe("Test CLI", () => {
  test("Usage shows", async () => {
    const { run, assertLastWrite, writeOutSpy, writeErrSpy } = setupCliTest();

    await run("--help");
    expect(writeOutSpy).toBeCalledTimes(1);
    assertLastWrite(USAGE_OUTPUT_PATTERN);

    await run("help");
    expect(writeOutSpy).toBeCalledTimes(2);
    assertLastWrite(USAGE_OUTPUT_PATTERN);

    await run("");
    expect(writeOutSpy).toBeCalledTimes(3);
    assertLastWrite(USAGE_OUTPUT_PATTERN);

    await run("something-very-wrong");
    expect(writeErrSpy).toBeCalledTimes(1);
    expect(writeOutSpy).toBeCalledTimes(4);
    assertLastWrite(/unknown command 'something-very-wrong'/, "error");
    assertLastWrite(USAGE_OUTPUT_PATTERN);
  });

  test("Global Option --log-level", async () => {
    acknowledgeGlobalOptionTest("logLevel");

    // eslint-disable-next-line no-console
    const debug = console.debug;
    // eslint-disable-next-line no-console
    console.debug = () => void 0;

    const { run, assertLastWrite } = setupCliTest();

    await run("--log-level=silent");
    expect(logger.printLevel).toBe("silent");

    await run("--log-level=debug");
    expect(logger.printLevel).toBe("debug");

    await run("--log-level=info");
    expect(logger.printLevel).toBe("info");

    await run("--log-level=warn");
    expect(logger.printLevel).toBe("warn");

    await run("--log-level=error");
    expect(logger.printLevel).toBe("error");

    await run("--log-level=wrong");
    assertLastWrite(/option.+--log-level.+wrong.+is invalid/, "error");

    logger.printLevel = "silent";

    // eslint-disable-next-line no-console
    console.debug = debug;
  });

  test("Global Option --cwd", async () => {
    acknowledgeGlobalOptionTest("cwd");

    const { run, assertLastWrite } = setupCliTest();

    await run(`--cwd=${getProjectRoot("simple1")} ls --name-only`);
    assertLastWrite(
      /application-1a\napplication-1b\nlibrary-1a\nlibrary-1b$/m,
      "commandOutput",
    );

    await run(`--cwd=${getProjectRoot("simple2")} ls --name-only`);
    assertLastWrite(
      /application-2a\napplication-2b\nlibrary-2a\nlibrary-2b$/m,
      "commandOutput",
    );

    await run(`--cwd=does-not-exist ls`);
    assertLastWrite(
      /Working directory not found at path "does-not-exist"/,
      "error",
    );

    const notADirectoryPath = path.resolve(__dirname, "util/not-a-directory");
    await run(`--cwd=${notADirectoryPath} ls`);
    assertLastWrite(
      `Working directory is not a directory at path "${notADirectoryPath}"`,
      "error",
    );
  });

  test("Global Option --config-file", async () => {
    acknowledgeGlobalOptionTest("configFile");

    const { run, assertLastWrite, writeCommandOutputSpy } = setupCliTest();

    await run(`--cwd=${getProjectRoot("simple1")} info appB`);
    expect(writeCommandOutputSpy).toBeCalledTimes(1);
    assertLastWrite(/^Workspace: application-1b/, "commandOutput");

    await run(
      `--cwd=${getProjectRoot("simple1")} --config-file=bw.alt.json info appB-alt`,
    );
    expect(writeCommandOutputSpy).toBeCalledTimes(2);
    assertLastWrite(/^Workspace: application-1b/, "commandOutput");

    await run(
      `--cwd=${getProjectRoot("simple1")} --config-file=does-not-exist.json ls`,
    );
    assertLastWrite(
      `Config file not found at path "${path.resolve(getProjectRoot("simple1"), "does-not-exist.json")}"`,
      "error",
    );

    await run(`--cwd=${getProjectRoot("invalidBadJsonConfig")}  ls`);
    assertLastWrite(
      `Failed to parse config file at path "${path.resolve(getProjectRoot("invalidBadJsonConfig"), "bw.json")}"`,
      "error",
    );

    await run(`--cwd=${getProjectRoot("invalidBadConfigRoot")}  ls`);
    assertLastWrite(`Config file: must be an object`, "error");

    await run(
      `--cwd=${getProjectRoot("invalidBadConfigWorkspaceAliases")}  ls`,
    );
    assertLastWrite(
      `Config file: project.workspaceAliases must be an object`,
      "error",
    );
  });

  test("Confirm all global options are tested", () => {
    validateAllGlobalOptionTests();
  });
});
