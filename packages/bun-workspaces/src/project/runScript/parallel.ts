import { availableParallelism } from "node:os";
import { BunWorkspacesError } from "../../internal/error";

export type PercentageValue = `${number}%`;

export type ParallelMaxValue = number | "auto" | "unbounded" | PercentageValue;

export const determineParallelMax = (value: ParallelMaxValue) => {
  if (typeof value === "number") {
    if (value < 1 || isNaN(value)) {
      throw new BunWorkspacesError("Parallel max value must be at least 1");
    }
    return Math.floor(value);
  }

  value = value.trim() as Exclude<ParallelMaxValue, number>;

  if (value === "auto") {
    return availableParallelism();
  }

  if (value === "unbounded") {
    return Infinity;
  }

  if (value.endsWith("%")) {
    const percentage = parseInt(value.slice(0, -1));
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      throw new BunWorkspacesError(
        "Parallel max value must be a number between 0 and 100",
      );
    }

    return Math.max(1, Math.floor((availableParallelism() * percentage) / 100));
  }

  throw new BunWorkspacesError(
    `Invalid parallel max value: ${JSON.stringify(value)}`,
  );
};
