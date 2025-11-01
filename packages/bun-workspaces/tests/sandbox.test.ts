import { expect, describe, test } from "bun:test";
import { setupTest } from "./util/newUtils";

describe("Sandbox", () => {
  test("should run a command", async () => {
    const { outputLines, combinedOutput } = await setupTest().run("hello");
  });
});
