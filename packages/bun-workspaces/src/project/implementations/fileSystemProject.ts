import { findWorkspacesFromPackage, type Workspace } from "../../workspaces";
import { ProjectBase, type Project } from "./projectBase";

export interface CreateFileSystemProjectOptions {
  rootDir: string;
  workspaceAliases?: Record<string, string>;
}

class FileSystemProject extends ProjectBase {
  public readonly rootDir: string;
  public readonly workspaces: Workspace[];
  public readonly name: string;
  constructor(options: CreateFileSystemProjectOptions) {
    super();

    this.rootDir = options.rootDir;

    const { name, workspaces } = findWorkspacesFromPackage({
      rootDir: options.rootDir,
      workspaceAliases: options.workspaceAliases,
    });

    this.name = name;
    this.workspaces = workspaces;
  }
}

export const createFileSystemProject = (
  options: CreateFileSystemProjectOptions,
): Project => new FileSystemProject(options);
