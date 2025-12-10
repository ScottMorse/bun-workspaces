export const USER_ENV_VARS = {
  parallelMax: "BW_PARALLEL_MAX",
} as const;

export type UserEnvVarName = keyof typeof USER_ENV_VARS;

export const getUserEnvVar = (key: UserEnvVarName) =>
  process.env[USER_ENV_VARS[key]];
