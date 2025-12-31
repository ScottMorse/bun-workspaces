import fs from "node:fs";
import { expect, test, describe } from "bun:test";
import { createTempFile, cleanTempDir } from "../src/internal/runtime/tempFile";
import { runScript } from "../src/project";

describe("Temp file utils", () => {
  test("createTempFile", () => {
    const { filePath, cleanup } = createTempFile("test.txt", "test");
    expect(fs.readFileSync(filePath, "utf8")).toBe("test");
    cleanup();
    expect(fs.existsSync(filePath)).toBe(false);
  });

  test("cleanTempDir", () => {
    const { filePath: a } = createTempFile("a.txt", "test a");
    const { filePath: b } = createTempFile("b.txt", "test b");
    const { filePath: c } = createTempFile("c.txt", "test c");

    expect(fs.readFileSync(a, "utf8")).toBe("test a");
    expect(fs.readFileSync(b, "utf8")).toBe("test b");
    expect(fs.readFileSync(c, "utf8")).toBe("test c");

    cleanTempDir();

    expect(fs.existsSync(a)).toBe(false);
    expect(fs.existsSync(b)).toBe(false);
    expect(fs.existsSync(c)).toBe(false);
  });

  test("createTempFile: cleans up on exit", async () => {
    const { exit, output } = runScript({
      scriptCommand: {
        command: "bun run testScripts/createTempFile.ts",
        workingDirectory: __dirname,
      },
      metadata: {},
      env: {},
    });

    let filePath = "";
    for await (const chunk of output) {
      filePath = chunk.decode().trim();
      expect(fs.readFileSync(filePath, "utf8")).toBe("from createTempFile.ts");
    }

    await exit;

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test("createTempFile: cleans up on interrupt", async () => {
    const { exit, output, kill } = runScript({
      scriptCommand: {
        command: "bun run testScripts/createTempFile.ts",
        workingDirectory: __dirname,
      },
      metadata: {},
      env: {},
    });

    let filePath = "";
    for await (const chunk of output) {
      filePath = chunk.decode().trim();
      expect(fs.readFileSync(filePath, "utf8")).toBe("from createTempFile.ts");
      kill("SIGINT");
    }

    await exit;

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test("createTempFile: cleans up on crash", async () => {
    const { exit, output } = runScript({
      scriptCommand: {
        command: "bun run testScripts/createTempFile.ts",
        workingDirectory: __dirname,
      },
      metadata: {},
      env: {
        CRASH: "true",
      },
    });

    let filePath = "";
    let stderr = "";
    for await (const chunk of output) {
      if (chunk.streamName === "stderr") {
        stderr += chunk.decode({ stripAnsi: true }).trim();
        continue;
      }

      filePath = chunk.decode().trim();
      expect(fs.readFileSync(filePath, "utf8")).toBe("from createTempFile.ts");
    }

    expect(stderr).toMatch(/error: Test crash/g);
    expect(stderr).toMatch(/throw new Error\("Test crash"\)/g);

    await exit;

    expect(fs.existsSync(filePath)).toBe(false);
  });
});
