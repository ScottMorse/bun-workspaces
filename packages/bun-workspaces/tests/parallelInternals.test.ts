import { availableParallelism } from "node:os";
import { expect, test, describe } from "bun:test";
import { determineParallelMax } from "../src/project/runScript/parallel";

describe("Parallelism core logic", () => {
  test("determineParallelMax", () => {
    expect(determineParallelMax("auto")).toBe(availableParallelism());
    expect(determineParallelMax("unbounded")).toBe(Infinity);
    expect(determineParallelMax("10%")).toBe(
      Math.floor((availableParallelism() * 10) / 100),
    );
    expect(determineParallelMax("0.0001%")).toBe(1);
    expect(determineParallelMax(10)).toBe(10);
    expect(() => determineParallelMax(0)).toThrow();
    expect(() => determineParallelMax(NaN)).toThrow();
    expect(() => determineParallelMax(-1)).toThrow();
    expect(() => determineParallelMax(-2)).toThrow();
    expect(() => determineParallelMax("101%")).toThrow();
    expect(() => determineParallelMax("0%")).toThrow();
    expect(() => determineParallelMax("-1%")).toThrow();
    // @ts-expect-error - Invalid parallel max value
    expect(() => determineParallelMax("wrong")).toThrow();
  });
});
