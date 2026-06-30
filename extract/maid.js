import { join } from "node:path";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { norm } from "./mlib.js";

// maid 的 test-fixtures 按类型分 valid/invalid 目录，invalid 配 expected-errors.json
const TYPES = ["flowchart", "pie", "sequence", "class", "state"];

const readMmd = (dir) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith(".mmd"))
          .map((f) => [f, readFileSync(join(dir, f), "utf8")])
      : [],
  readErrors = (path) => {
    if (!existsSync(path)) return {};
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch {
      return {};
    }
  },
  // maid 的 fixtures 已按类型分目录，类型以目录为准（invalid 样本头部可能本就残缺）
  entry = (src, type, valid, errors) => ({ source: norm(src), type, valid, errors, from: "maid" });

export default (root) => {
  const base = join(root, "test-fixtures"),
    out = [];
  for (const type of TYPES) {
    const dir = join(base, type);
    readMmd(join(dir, "valid")).forEach(([, src]) => out.push(entry(src, type, true)));
    const err_map = readErrors(join(dir, "expected-errors.json"));
    readMmd(join(dir, "invalid")).forEach(([name, src]) =>
      out.push(entry(src, type, false, err_map[name] || [])),
    );
  }
  return out;
};
