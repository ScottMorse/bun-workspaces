import path from "node:path";
import { describe, test, expect } from "bun:test";
import {
  BUN_LOCK_ERRORS,
  parseBunLock,
  readBunLockfile,
  type RelevantBunLock,
} from "../src/internal/bun/bunLock";

const rootDirectory = path.join(
  __dirname,
  "../../.." + (process.env.IS_BUILD === "true" ? "/../" : ""),
);

describe("bun.lock utilities", () => {
  test("parseBunLock", async () => {
    expect(
      parseBunLock(`{
        "lockfileVersion": 1, // this is jsonc
        /* this is jsonc */
      }`),
    ).toEqual({
      lockfileVersion: 1,
      workspaces: {},
    });

    expect(
      parseBunLock(`{
      "lockfileVersion": 1, // this is jsonc
      /* this is jsonc */
      "workspaces": {
        "application-a": {
          "name": "application-a"
        }
      }
    }`),
    ).toEqual({
      lockfileVersion: 1,
      workspaces: {
        "application-a": {
          name: "application-a",
        },
      },
    });

    // malformed json
    expect(
      parseBunLock(`{
        "lockfileVersion": 1, // this is jsonc
        /* this is jsonc */
      `),
    ).toBeInstanceOf(BUN_LOCK_ERRORS.MalformedBunLock);

    // wrong json type
    expect(parseBunLock(`[]`)).toBeInstanceOf(BUN_LOCK_ERRORS.MalformedBunLock);
    expect(parseBunLock(`1`)).toBeInstanceOf(BUN_LOCK_ERRORS.MalformedBunLock);
    expect(parseBunLock(`null`)).toBeInstanceOf(
      BUN_LOCK_ERRORS.MalformedBunLock,
    );

    // unsupported lockfile version
    expect(
      parseBunLock(`{
        /* this is jsonc */
        "lockfileVersion": 2, // this is jsonc
      }`),
    ).toBeInstanceOf(BUN_LOCK_ERRORS.UnsupportedBunLockVersion);

    expect(
      parseBunLock(`{
        /* this is jsonc */
        "lockfileVersion": 2, // this is jsonc
      }`),
    ).toBeInstanceOf(BUN_LOCK_ERRORS.UnsupportedBunLockVersion);

    // No lockfile version
    expect(
      parseBunLock(`{
        /* this is jsonc */
      }`),
    ).toBeInstanceOf(BUN_LOCK_ERRORS.UnsupportedBunLockVersion);

    expect(
      (
        parseBunLock(`{
        /* this is jsonc */
      }`) as Error
      ).message,
    ).toContain("could not find property lockfileVersion");
  });

  test("readBunLockfile", () => {
    expect(readBunLockfile("does-not-exist")).toBeInstanceOf(
      BUN_LOCK_ERRORS.BunLockNotFound,
    );

    const projectBunLock = readBunLockfile(rootDirectory) as RelevantBunLock;

    expect(projectBunLock).toEqual({
      lockfileVersion: 1,
      workspaces: {
        "": expect.any(Object),
        "packages/bun-workspaces": expect.any(Object),
        "packages/doc-website": expect.any(Object),
        "packages/sandbox": expect.any(Object),
      },
    });

    expect(projectBunLock.workspaces["packages/bun-workspaces"].name).toBe(
      "bun-workspaces",
    );
    expect(projectBunLock.workspaces["packages/doc-website"].name).toBe(
      "@bw/doc-website",
    );
    expect(projectBunLock.workspaces["packages/sandbox"].name).toBe(
      "@bw/sandbox",
    );

    expect(readBunLockfile(path.join(rootDirectory, "bun.lock"))).toEqual(
      projectBunLock,
    );
  });
});
