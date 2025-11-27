export interface ScriptRuntimeMetadata {
  projectPath: string;
  workspacePath: string;
  workspaceName: string;
  scriptName: string;
}

const SCRIPT_RUNTIME_METADATA_CONFIG = {
  projectPath: {
    inlineName: "<projectPath>",
    envVarName: "BW_PROJECT_PATH",
  },
  workspacePath: {
    inlineName: "<workspacePath>",
    envVarName: "BW_WORKSPACE_PATH",
  },
  scriptName: {
    inlineName: "<scriptName>",
    envVarName: "BW_SCRIPT_NAME",
  },
  workspaceName: {
    inlineName: "<workspace>",
    envVarName: "BW_WORKSPACE_NAME",
  },
} as const;

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
        .map((value) => value.inlineName)
        .join("|"),
      "g",
    ),
    (match) => {
      const key = Object.entries(SCRIPT_RUNTIME_METADATA_CONFIG).find(
        ([_, value]) => value.inlineName === match,
      )?.[0];
      return metadata[key as keyof ScriptRuntimeMetadata];
    },
  );
