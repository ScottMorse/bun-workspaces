import { createFileSystemProject } from "bun-workspaces_local";
import { createCli } from "bun-workspaces_local/src/cli";

if (import.meta.main && process.env.CLI === "true") {
  createCli({ defaultCwd: "test-project" }).run();
} else {
  const project = createFileSystemProject({
    rootDirectory: "test-project",
  });

  const { output } = project.runScriptAcrossWorkspaces({
    workspacePatterns: ["*"],
    script:
      'bun run <projectPath>/script.ts --inline-args="<projectPath> <workspacePath> <workspaceName> <workspaceRelativePath> <scriptName>"',
    args: '--appended-args="<projectPath> <workspacePath> <workspaceName> <workspaceRelativePath> <scriptName>"',
    inline: true,
  });

  for await (const { outputChunk } of output) {
    console.log(outputChunk.decode().trim());
  }
}
