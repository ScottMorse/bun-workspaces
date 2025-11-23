/** Does not change an object type, but remaps it for cleaner Intellisense only */
export type Simplify<T extends object> = {
  [K in keyof T]: T[K];
};
