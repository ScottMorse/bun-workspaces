import { Glob } from "bun";
import { defineErrors, createWildcardRegex } from "../internal/core";
import type { Workspace } from "./workspace";

const TARGETS = ["path", "alias", "name"] as const;

export const WORKSPACE_PATTERN_ERRORS = defineErrors("InvalidWorkspacePattern");

export type WorkspacePatternTarget = (typeof TARGETS)[number];

export type WorkspacePattern = {
  target: WorkspacePatternTarget | "default";
  value: string;
  isNegated: boolean;
};

const SEPARATOR = ":";

export const parseStringWorkspacePattern = (
  pattern: string,
): WorkspacePattern => {
  const target = TARGETS.find((target) => pattern.startsWith(target));
  if (!target) {
    return {
      target: "default",
      value: pattern,
      isNegated: pattern.startsWith("!"),
    };
  }

  const value = pattern.slice(target.length + SEPARATOR.length);

  return {
    target,
    value,
    isNegated: value.startsWith("!"),
  };
};

export const stringifyWorkspacePattern = (
  pattern: WorkspacePattern,
): string => {
  return `${pattern.target}${SEPARATOR}${pattern.value}`;
};

export const matchWorkspacesByPattern = (
  pattern: WorkspacePattern,
  workspaces: Workspace[],
) => {
  const hasWildcard = pattern.value.includes("*");
  const wildcardRegex = createWildcardRegex(pattern.value);

  if (pattern.target === "default") {
    return workspaces.filter((workspace) => {
      return hasWildcard
        ? wildcardRegex.test(workspace.name)
        : workspace.name === pattern.value ||
            workspace.aliases.includes(pattern.value);
    });
  }

  if (pattern.target === "name") {
    return workspaces.filter((workspace) => {
      return hasWildcard
        ? wildcardRegex.test(workspace.name)
        : workspace.name === pattern.value;
    });
  }

  if (pattern.target === "alias") {
    return workspaces.filter((workspace) => {
      return hasWildcard
        ? workspace.aliases.some((alias) => wildcardRegex.test(alias))
        : workspace.aliases.includes(pattern.value);
    });
  }

  if (pattern.target === "path") {
    return workspaces.filter((workspace) =>
      new Glob(pattern.value).match(workspace.path),
    );
  }

  return [];
};
