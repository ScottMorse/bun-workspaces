import type { ProcessEventMap } from "process";

export const runOnExit = <
  F extends (exit?: keyof ProcessEventMap | number) => unknown,
>(
  fn: F,
) => {
  let ran = false;

  const run = (exit?: keyof ProcessEventMap | number) => {
    if (ran) return;
    ran = true;
    fn(exit);
  };

  const onExit = (exit?: number) => {
    run(exit);
    process.removeListener("exit", onExit);
  };

  process.on("exit", onExit);

  for (const signal of [
    `SIGINT`,
    `SIGUSR1`,
    `SIGUSR2`,
    `SIGTERM`,
  ] satisfies (keyof ProcessEventMap)[]) {
    const onSignal = (signal: keyof ProcessEventMap) => {
      run(signal);
      process.removeListener(signal, onSignal);
      process.kill(process.pid, signal);
    };
    process.on(signal, onSignal);
  }
};
