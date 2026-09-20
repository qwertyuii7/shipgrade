import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  minify: true,
  target: "node20",
  outDir: "dist",
});
