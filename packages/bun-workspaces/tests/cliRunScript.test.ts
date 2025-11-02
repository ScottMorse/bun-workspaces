import { test, expect, describe } from "bun:test";
import {
  getProjectCommandConfig,
  type CliProjectCommandName,
} from "../src/cli/projectCommands";
import { setupCliTest, assertOutputMatches } from "./util/cliTestUtils";

describe("CLI Run Script", () => {
  test("Run script for all workspaces", async () => {
    const { run } = setupCliTest({
      testProject: "simple1",
    });
  });
});
