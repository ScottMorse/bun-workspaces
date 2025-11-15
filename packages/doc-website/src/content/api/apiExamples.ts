export const CREATE_FS_PROJECT_EXAMPLE = `import { createFileSystemProject } from "bun-workspaces";

const project = createFileSystemProject({
  // If the script is running from the
  // same directory as the intended project
  rootDirectory: ".",
});

console.log(project.name); // The name from the root package.json
console.log(project.workspaces); // An array of workspaces found in the project
`;

export const CREATE_MEMORY_PROJECT_EXAMPLE = `import { createMemoryProject } from "bun-workspaces";

const testProject = createMemoryProject({
  workspaces: [
    {
      name: "my-test-workspace",
      path: "my/test/workspace/path",
      matchPattern: "my/test/workspace/pattern/*",
      scripts: ["my-test-script"],
      aliases: ["test-alias"],
    },
  ]
});
`;
