import { join } from "node:path";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { norm, classify } from "./mlib.js";

const walk = (dir, ext, acc = []) => {
    if (!existsSync(dir)) return acc;
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path, ext, acc);
      else if (name.endsWith(ext)) acc.push(path);
    }
    return acc;
  },
  decode = (s) =>
    s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
      .replace(/&amp;/g, "&");

// mermaid-js 官方仓库：docs 的 ```mermaid 代码块 + demos 的 <pre|div class="mermaid">
export default (root) => {
  const out = [],
    seen = new Set(),
    add = (raw) => {
      const source = norm(raw);
      if (!source || seen.has(source)) return;
      seen.add(source);
      out.push({ source, type: classify(source), valid: true, from: "mermaid" });
    };

  for (const path of walk(join(root, "docs"), ".md")) {
    const content = readFileSync(path, "utf8"),
      re = /```mermaid\b[^\n]*\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(content)) !== null) add(m[1]);
  }

  for (const path of walk(join(root, "demos"), ".html")) {
    const content = readFileSync(path, "utf8"),
      re = /<(pre|div)[^>]*class="[^"]*\bmermaid\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
    let m;
    while ((m = re.exec(content)) !== null) add(decode(m[2]));
  }

  return out;
};
