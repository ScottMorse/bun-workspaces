import { BunWorkspacesError } from "../internal/error";

export const USER_ENV_VARS = {
  parallelMaxDefault: "BW_PARALLEL_MAX_DEFAULT",
} as const;

export type UserEnvVarName = keyof typeof USER_ENV_VARS;

export const getUserEnvVarNumber = (key: UserEnvVarName) => {
  const value = getUserEnvVar(key);
  if (value) {
    const num = parseInt(value);
    if (isNaN(num)) {
      throw new BunWorkspacesError(
        `Invalid number for env var "${key}": "${value}"`,
      );
    }
    return num;
  }
  return undefined;
};

export const getUserEnvVar = (key: UserEnvVarName) =>
  process.env[USER_ENV_VARS[key]];

export const getUserEnvVarName = (key: UserEnvVarName) => USER_ENV_VARS[key];
