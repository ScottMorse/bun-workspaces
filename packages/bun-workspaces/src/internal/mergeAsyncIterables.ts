export const mergeAsyncIterables = <T>(
  iterables: AsyncIterable<T>[],
): AsyncIterable<T> => ({
  async *[Symbol.asyncIterator]() {
    const iterators = iterables.map((it) => it[Symbol.asyncIterator]());
    type NextState = { index: number; result: IteratorResult<T> };

    const makeNext = (index: number) =>
      iterators[index].next().then((result): NextState => ({ index, result }));

    const nexts = iterators.map((_, i) => makeNext(i));

    let activeCount = iterators.length;
    while (activeCount > 0) {
      const { index, result } = await Promise.race(nexts);
      if (result.done) {
        activeCount--;
        // replace with a never-resolving promise so race ignores this iterator
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        nexts[index] = new Promise<never>(() => {});
        continue;
      }

      // schedule next before yielding to keep it “live”
      nexts[index] = makeNext(index);
      yield result.value;
    }
  },
});
