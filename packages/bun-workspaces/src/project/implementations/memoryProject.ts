import type { Simplify } from "../../internal/types";
import {
  validateWorkspaceAliases,
  WORKSPACE_ERRORS,
  type Workspace,
} from "../../workspaces";
import type { Project } from "../project";
import { ProjectBase } from "./projectBase";

/** Arguments for {@link createMemoryProject} */
export type CreateMemoryProjectOptions = {
  /** The list of workspaces in the project */
  workspaces: Workspace[];
  /** The name of the project */
  name?: string;
  /** The root directory of the project (not used in any actual file system interactions in a {@link MemoryProject}) */
  rootDirectory?: string;
};

class _MemoryProject extends ProjectBase implements Project {
  public readonly rootDirectory: string;
  public readonly workspaces: Workspace[];
  public readonly name: string;
  public readonly sourceType = "memory";
  constructor(options: CreateMemoryProjectOptions) {
    super();
    this.name = options.name ?? "";
    this.rootDirectory = options.rootDirectory ?? "";
    this.workspaces = options.workspaces;

    for (const workspace of this.workspaces) {
      if (
        this.workspaces.find(
          (ws) => ws !== workspace && ws.name === workspace.name,
        )
      ) {
        throw new WORKSPACE_ERRORS.DuplicateWorkspaceName(
          `Duplicate workspace name found: ${JSON.stringify(workspace.name)}`,
        );
      }
    }

    validateWorkspaceAliases(
      this.workspaces,
      this.workspaces.reduce(
        (acc, workspace) => {
          for (const alias of workspace.aliases) {
            acc[alias] = workspace.name;
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
  }
}

/**
 * An implementation of {@link Project} that is created from a list of workspaces in memory.
 *
 * Mainly used for testing without needing a real file system project. */
export type MemoryProject = Simplify<InstanceType<typeof _MemoryProject>>;

/** Create a {@link Project} from a provided list of workspace objects.
 *
 * Mainly used for testing without needing a real file system project. */
export const createMemoryProject = (
  options: CreateMemoryProjectOptions,
): MemoryProject => new _MemoryProject(options);
