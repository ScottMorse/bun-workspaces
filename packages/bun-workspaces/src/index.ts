export {
  findWorkspaces,
  type FindWorkspacesOptions,
  type Workspace,
  type resolvePackageJsonContent,
  type resolvePackageJsonPath,
  type scanWorkspaceGlob,
  type ResolvedPackageJsonContent,
} from "./workspaces";

export {
  createFileSystemProject,
  type CreateFileSystemProjectOptions,
  type Project,
  type CreateProjectScriptCommandOptions,
  type ScriptMetadata,
} from "./project";
