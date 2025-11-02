import { expect, describe, test } from "bun:test";
import { setupTest } from "./util/newUtils";

describe("Sandbox", () => {
  test("should run a command", async () => {
    const { outputLines, stdoutAndErr } = await setupTest().run("hello");
    console.log(stdoutAndErr.raw);
  });
});
