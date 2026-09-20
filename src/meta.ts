import fs from "fs";
import { URL } from "url";

const pkgPath = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

export const META = {
  name: "shipgrade",
  version: pkg.version,
  schemaVersion: "1.1",
  bin: "shipgrade",
  repo: "https://github.com/qwertyuii7/shipgrade",
  userAgent: `shipgrade/${pkg.version} (+https://github.com/qwertyuii7/shipgrade)`,
};
