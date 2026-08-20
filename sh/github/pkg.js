import { join } from "node:path";
import rJson from "@3-/read/rJson.js";
import write from "@3-/write";
import ROOT from "../ROOT.js";

const gen = (target_dir) => {
  const pkg_path = join(target_dir, "package.json"),
    pkg = rJson(pkg_path);

  for (const key of ["devDependencies", "files", "scripts", "lint-staged"]) {
    delete pkg[key];
  }
  if (pkg.exports) {
    pkg.exports = JSON.parse(JSON.stringify(pkg.exports).replaceAll("./src/", "./"));
  }
  write(join(target_dir, "lib/package.json"), JSON.stringify(pkg));
};

export default gen;

if (import.meta.main) {
  gen(ROOT);
}
