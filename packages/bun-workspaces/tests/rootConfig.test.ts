import { describe, expect, test } from "bun:test";
import { loadRootConfig } from "../src/config/rootConfig";
import { getProjectRoot } from "./testProjects";

describe("Test project root config", () => {
  test("Test loadRootConfig", () => {
    const config = loadRootConfig(getProjectRoot("default"));
    expect(config).toEqual({
      defaults: {
        parallelMax: 10,
        shell: "bun",
      },
    });
  });
});
