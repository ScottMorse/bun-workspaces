import fs from "fs";
import path from "path";
import { findWorkspaces, type Workspace } from "../../workspaces";
import { ProjectBase, type Project } from "./projectBase";

export interface CreateFileSystemProjectOptions {
  rootDir: string;
  /** The name of the project. By default will use the root package.json name */
  name?: string;
}

class FileSystemProject extends ProjectBase {
  public readonly rootDir: string;
  public readonly workspaces: Workspace[];
  public readonly name: string;
  constructor(
    options: CreateFileSystemProjectOptions & {
      /** @deprecated  */
      workspaceAliases?: Record<string, string>;
    },
  ) {
    super();

    this.rootDir = options.rootDir;

    const { workspaces } = findWorkspaces({
      rootDir: options.rootDir,
      workspaceAliases: options.workspaceAliases,
    });

    this.workspaces = workspaces;

    if (!options.name) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.rootDir, "package.json"), "utf8"),
      );
      this.name = packageJson.name ?? "";
    } else {
      this.name = "";
    }
  }
}

export const createFileSystemProject = (
  options: CreateFileSystemProjectOptions,
): Project => new FileSystemProject(options);

/** @deprecated temporarily supports workspaceAliases from deprecated config file */
export const _internalCreateFileSystemProject = (
  options: CreateFileSystemProjectOptions & {
    /** @deprecated  */
    workspaceAliases?: Record<string, string>;
  },
): Project => new FileSystemProject(options);
