import path from "path";
import { Glob } from "bun";
// @ts-expect-error - Importing from mjs file in build for build:test script
import { setLogLevel } from "./src/index.mjs";
// @ts-expect-error - Importing from mjs file in build for build:test script
import { runScript } from "./src/runScript/index.mjs";

setLogLevel("silent");

const testProjectsDir = path.join(__dirname, "tests", "testProjects");

const promises: Promise<unknown>[] = [];

for (const file of new Glob("**/*/package.json").scanSync({
  cwd: testProjectsDir,
  absolute: true,
})) {
  promises.push(
    (async () => {
      try {
        await runScript({
          env: {},
          metadata: {},
          scriptCommand: {
            command: "bun install",
            workingDirectory: path.dirname(file),
          },
        }).exit;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error installing dependencies for ${file}:`, error);
      }
    })(),
  );
}

await Promise.all(promises);
