import fs from "fs";
import path from "path";

const pkg = JSON.parse(fs.readFileSync("./package.json"));
const version = pkg.version;

// JS version file
fs.writeFileSync(
  "./apps/version.ts",
  `export const VERSION = "${version}";\n`
);

// Python version file
fs.writeFileSync(
  "./core/syris_core/src/syris_core/version.py",
  `VERSION = "${version}"\n`
);

console.log("Version synced:", version);