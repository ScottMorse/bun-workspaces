import { IS_WINDOWS } from "../../src/internal/runtime";

export const withWindowsPath = (p: string) =>
  IS_WINDOWS ? p.replaceAll("/", "\\") : p;
