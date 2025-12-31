import type { ProcessEventMap } from "node:process";

export const runOnExit = <
  F extends (signal?: keyof ProcessEventMap) => unknown,
>(
  fn: F,
) => {
  for (const signal of [
    `exit`,
    `SIGINT`,
    `SIGUSR1`,
    `SIGUSR2`,
    `SIGTERM`,
  ] satisfies (keyof ProcessEventMap)[]) {
    process.on(signal, fn);
  }
};
