import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { norm, classify } from "./mlib.js";

// beautiful-mermaid 的样本集中在 *-samples-data.ts 的 `source: \`...\`` 模板串里
const FILES = ["samples-data.ts", "xychart-samples-data.ts"];

export default (root) => {
  const out = [],
    seen = new Set();
  for (const file of FILES) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8"),
      re = /source:\s*`([\s\S]*?)`/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const source = norm(m[1]);
      if (!source || seen.has(source)) continue;
      seen.add(source);
      out.push({ source, type: classify(source), valid: true, from: "beautiful-mermaid" });
    }
  }
  return out;
};
