import path from "path";
import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      format: "esm",
      dts: true,
      bundle: false,
      source: {
        include: ["src/**/*.ts"],
      },
    },
  ],
  output: {
    distPath: {
      root: "dist/src",
    },
    cleanDistPath: true,
    copy: [
      {
        from: path.resolve(__dirname, "package.json"),
        to: "../package.json",
      },
      {
        from: path.resolve(__dirname, "../../README.md"),
        to: "../README.md",
      },
      {
        from: path.resolve(__dirname, "bin"),
        to: "../bin",
      },
    ],
  },
});
