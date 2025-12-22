import { availableParallelism } from "node:os";
import { getUserEnvVar, getUserEnvVarName } from "../../config/userEnvVars";
import { BunWorkspacesError } from "../../internal/core";

export type PercentageValue = `${number}%`;

export type ParallelMaxValue =
  | number
  | "auto"
  | "default"
  | "unbounded"
  | PercentageValue;

/** Should always return at least 1 */
export const determineParallelMax = (
  value: ParallelMaxValue,
  fromEnvVar = false,
): number => {
  const errorMessageSuffix = fromEnvVar
    ? ` (set by env var ${getUserEnvVarName("parallelMaxDefault")})`
    : "";

  if (!isNaN(Number(value))) {
    value = Math.floor(Number(value));
  }

  if (typeof value === "number") {
    if (value < 1 || isNaN(value)) {
      throw new BunWorkspacesError(
        `Parallel max value must be at least 1${errorMessageSuffix}`,
      );
    }
    return Math.floor(value);
  }

  if (value === "default") {
    const defaultMax = getUserEnvVar("parallelMaxDefault")?.trim();
    if (defaultMax === "default") return determineParallelMax("auto");
    return determineParallelMax(
      (defaultMax as ParallelMaxValue) ?? "auto",
      true,
    );
  }

  if (value === "unbounded") {
    return Infinity;
  }

  const cpuCount = Math.max(1, availableParallelism());

  if (value === "auto") {
    return cpuCount;
  }

  if (value.endsWith("%")) {
    const percentage = parseFloat(value.slice(0, -1));
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      throw new BunWorkspacesError(
        `Parallel max value must be a number greater than 0 and less than or equal to 100${errorMessageSuffix}`,
      );
    }

    return Math.max(1, Math.floor((cpuCount * percentage) / 100));
  }

  throw new BunWorkspacesError(
    `Invalid parallel max value: ${JSON.stringify(value)}${errorMessageSuffix}`,
  );
};
