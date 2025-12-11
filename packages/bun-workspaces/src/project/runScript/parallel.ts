import { availableParallelism } from "node:os";
import { BunWorkspacesError } from "../../internal/error";

export type PercentageValue = `${number}%`;

export type ParallelMaxValue = number | "auto" | "unbounded" | PercentageValue;

/** Should always return at least 1 */
export const determineParallelMax = (value: ParallelMaxValue) => {
  if (typeof value === "number") {
    if (value < 1 || isNaN(value)) {
      throw new BunWorkspacesError("Parallel max value must be at least 1");
    }
    return Math.floor(value);
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
        "Parallel max value must be a number greater than 0 and less than or equal to 100",
      );
    }

    return Math.max(1, Math.floor((cpuCount * percentage) / 100));
  }

  throw new BunWorkspacesError(
    `Invalid parallel max value: ${JSON.stringify(value)}`,
  );
};
