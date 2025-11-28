import { createFileSystemProject } from "bun-workspaces_release";
import { createCli } from "bun-workspaces_release/src/cli";

if (import.meta.main && process.env.CLI === "true") {
  createCli().run();
} else {
  const project = createFileSystemProject({
    rootDirectory: "../..",
  });
}
