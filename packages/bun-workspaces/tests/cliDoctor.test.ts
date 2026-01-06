import { expect, test, describe } from "bun:test";
import packageJson from "../package.json";
import { getDoctorInfo } from "../src/doctor";
import { createRawPattern } from "../src/internal/core";
import { setupCliTest, assertOutputMatches } from "./util/cliTestUtils";

describe("CLI - doctor command", () => {
  test("Basic output", async () => {
    const { run } = setupCliTest();

    const result = await run("doctor");
    expect(result.stderr.raw).toBeEmpty();
    expect(result.exitCode).toBe(0);
    assertOutputMatches(
      result.stdout.sanitizedCompactLines,
      new RegExp(
        "^" +
          createRawPattern(`bun-workspaces
Version: ${packageJson.version}
Bun Version: ${Bun.version_with_sha}`),
        "m",
      ),
    );

    const jsonResult = await run("doctor", "--json");
    expect(jsonResult.stderr.raw).toBeEmpty();
    expect(jsonResult.exitCode).toBe(0);
    const jsonResultObject = JSON.parse(jsonResult.stdout.raw);
    delete jsonResultObject.binary.path;
    const expectedInfo = getDoctorInfo();
    delete (expectedInfo.binary as { path?: string }).path;
    expect(jsonResultObject).toEqual(expectedInfo);

    const jsonPrettyResult = await run("doctor", "--json", "--pretty");
    expect(jsonPrettyResult.stderr.raw).toBeEmpty();
    expect(jsonPrettyResult.exitCode).toBe(0);
    const jsonPrettyResultObject = JSON.parse(jsonPrettyResult.stdout.raw);
    delete (jsonPrettyResultObject.binary as { path?: string }).path;
    expect(jsonPrettyResultObject).toEqual(expectedInfo);
  });
});
