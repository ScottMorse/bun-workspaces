import { createFileSystemProject } from "bun-workspaces_release";
import { createCli } from "bun-workspaces_release/src/cli";

if (import.meta.main && process.env.CLI === "true") {
  createCli().run();
} else {
  const project = createFileSystemProject({
    rootDirectory: ".",
  });

  const { output } = project.runScriptAcrossWorkspaces({
    workspacePatterns: ["p*"],
    script: "test",
    parallel: { max: "100%" },
  });

  for await (const { outputChunk } of output) {
    console.log(outputChunk.decode({ stripAnsi: false }).trim());
  }
}
