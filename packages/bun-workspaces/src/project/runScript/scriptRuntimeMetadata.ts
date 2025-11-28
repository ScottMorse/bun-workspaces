export interface ScriptRuntimeMetadata {
  projectPath: string;
  projectName: string;
  workspacePath: string;
  workspaceRelativePath: string;
  workspaceName: string;
  scriptName: string;
}

const SCRIPT_RUNTIME_METADATA_CONFIG = {
  projectPath: {
    inlineName: ["<projectPath>"],
    envVarName: "BW_PROJECT_PATH",
  },
  projectName: {
    inlineName: ["<projectName>"],
    envVarName: "BW_PROJECT_NAME",
  },
  workspacePath: {
    inlineName: ["<workspacePath>"],
    envVarName: "BW_WORKSPACE_PATH",
  },
  workspaceRelativePath: {
    inlineName: ["<workspaceRelativePath>"],
    envVarName: "BW_WORKSPACE_RELATIVE_PATH",
  },
  scriptName: {
    inlineName: ["<scriptName>"],
    envVarName: "BW_SCRIPT_NAME",
  },
  workspaceName: {
    /** @todo  @deprecated Deprecate <workspace> in favor of <workspaceName> in major release */
    inlineName: ["<workspaceName>", "<workspace>"],
    envVarName: "BW_WORKSPACE_NAME",
  },
} as const;

export type ScriptRuntimeMetadataKey =
  keyof typeof SCRIPT_RUNTIME_METADATA_CONFIG;

export const getScriptRuntimeMetadataConfig = (key: ScriptRuntimeMetadataKey) =>
  SCRIPT_RUNTIME_METADATA_CONFIG[key];

export const createScriptRuntimeEnvVars = (metadata: ScriptRuntimeMetadata) =>
  Object.entries(SCRIPT_RUNTIME_METADATA_CONFIG).reduce(
    (acc, [key, value]) => {
      acc[value.envVarName] = metadata[key as keyof ScriptRuntimeMetadata];
      return acc;
    },
    {} as Record<string, string>,
  );

export const interpolateScriptRuntimeMetadata = (
  text: string,
  metadata: ScriptRuntimeMetadata,
) =>
  text.replace(
    new RegExp(
      Object.values(SCRIPT_RUNTIME_METADATA_CONFIG)
        .flatMap((value) => value.inlineName)
        .join("|"),
      "g",
    ),
    (match) => {
      const key = Object.entries(SCRIPT_RUNTIME_METADATA_CONFIG).find(
        ([_, value]) => (value.inlineName as readonly string[]).includes(match),
      )?.[0];
      return metadata[key as keyof ScriptRuntimeMetadata];
    },
  );
