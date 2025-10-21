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
    // eslint-disable-next-line no-console
    const debug = console.debug;
    // eslint-disable-next-line no-console
    console.debug = () => void 0;

    const { run } = setupCliTest();

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

    logger.printLevel = "silent";

    // eslint-disable-next-line no-console
    console.debug = debug;

    acknowledgeGlobalOptionTest("logLevel");
  });

  test("Global Option --cwd", async () => {
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

    acknowledgeGlobalOptionTest("cwd");
  });

  test("Global Option --config-file", async () => {
    const { run, assertLastWrite, writeCommandOutputSpy, writeErrSpy } =
      setupCliTest();

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

    acknowledgeGlobalOptionTest("configFile");
  });

  test("Confirm all global options are tested", () => {
    validateAllGlobalOptionTests();
  });

  test.skip("Confirm all project commands are tested", () => {
    // for (const command of getCliProjectCommandNames()) {
    //   if (!acknowledgedCommandTests[command]) {
    //     throw new Error(
    //       `Test for project command ${command} was not acknowledged`,
    //     );
    //   }
    // }
  });
});
