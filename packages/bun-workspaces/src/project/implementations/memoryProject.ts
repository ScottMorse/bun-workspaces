import { type Workspace } from "../../workspaces";
import { ProjectBase, type Project } from "./projectBase";

export interface CreateMemoryProjectOptions {
  name: string;
  workspaces: Workspace[];
  rootDir: string;
}

class MemoryProject extends ProjectBase {
  public readonly rootDir: string;
  public readonly workspaces: Workspace[];
  public readonly name: string;
  constructor(options: CreateMemoryProjectOptions) {
    super();
    this.rootDir = options.rootDir;
    this.name = options.name;
    this.workspaces = options.workspaces;
  }
}

export const createMemoryProject = (
  options: CreateMemoryProjectOptions,
): Project => new MemoryProject(options);
