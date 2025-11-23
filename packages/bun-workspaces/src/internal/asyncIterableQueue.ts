export type AsyncQueueItem<T> = { type: "value"; value: T } | { type: "done" };

export const createAsyncIterableQueue = <T>() => {
  let pendingResolveIdle: ((value: IteratorResult<T>) => void) | null = null;
  const items: AsyncQueueItem<T>[] = [];
  let isDone = false;

  const push = (value: T) => {
    if (isDone) return;
    if (pendingResolveIdle) {
      const resolveIdle = pendingResolveIdle;
      pendingResolveIdle = null;
      resolveIdle({ value, done: false });
    } else {
      items.push({ type: "value", value });
    }
  };

  const close = () => {
    if (isDone) return;
    isDone = true;
    if (pendingResolveIdle) {
      const resolveIdle = pendingResolveIdle;
      pendingResolveIdle = null;
      resolveIdle({ value: undefined as unknown as T, done: true });
    } else {
      items.push({ type: "done" });
    }
  };

  const asyncIterator: AsyncIterator<T> = {
    next: () => {
      if (items.length > 0) {
        const item = items.shift()!;
        if (item.type === "done") {
          isDone = true;
          return Promise.resolve({
            value: undefined as unknown as T,
            done: true,
          });
        }
        return Promise.resolve({ value: item.value, done: false });
      }

      if (isDone) {
        return Promise.resolve({
          value: undefined,
          done: true,
        });
      }

      return new Promise<IteratorResult<T>>((resolve) => {
        pendingResolveIdle = resolve;
      });
    },
  };

  const iterator: AsyncIterable<T> & {
    push: (value: T) => void;
    close: () => void;
  } = {
    [Symbol.asyncIterator]: () => asyncIterator,
    push,
    close,
  };

  return iterator;
};
