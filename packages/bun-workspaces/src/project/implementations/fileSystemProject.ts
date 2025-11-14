import fs from "fs";
import path from "path";
import { findWorkspaces, type Workspace } from "../../workspaces";
import type { Project } from "../project";
import { ProjectBase } from "./projectBase";

/** Arguments for {@link createFileSystemProject} */
export type CreateFileSystemProjectOptions = {
  /** The directory containing the root package.json. Often the same root as a git repository. */
  rootDirectory: string;
  /** The name of the project. By default will use the root package.json name */
  name?: string;
};

class _FileSystemProject extends ProjectBase implements Project {
  public readonly rootDirectory: string;
  public readonly workspaces: Workspace[];
  public readonly name: string;
  public readonly sourceType = "fileSystem";
  constructor(
    options: CreateFileSystemProjectOptions & {
      /** @deprecated  */
      workspaceAliases?: Record<string, string>;
    },
  ) {
    super();

    this.rootDirectory = options.rootDirectory;

    const { workspaces } = findWorkspaces({
      rootDirectory: options.rootDirectory,
      workspaceAliases: options.workspaceAliases,
    });

    this.workspaces = workspaces;

    if (!options.name) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.rootDirectory, "package.json"), "utf8"),
      );
      this.name = packageJson.name ?? "";
    } else {
      this.name = "";
    }
  }
}

/** An implementation of {@link Project} that is created from a root directory in the file system. */
export type FileSystemProject = Required<_FileSystemProject>;

/**
 * Create a {@link Project} based on a given root directory.
 * Automatically finds workspaces based on the root package.json "workspaces" field
 * and detects and utilizes any provided configuration.
 */
export const createFileSystemProject = (
  options: CreateFileSystemProjectOptions,
): FileSystemProject => new _FileSystemProject(options);

/** @deprecated temporarily supports workspaceAliases from deprecated config file */
export const _internalCreateFileSystemProject = (
  options: CreateFileSystemProjectOptions & {
    /** @deprecated  */
    workspaceAliases?: Record<string, string>;
  },
): FileSystemProject => new _FileSystemProject(options);
