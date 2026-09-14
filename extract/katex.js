#!/usr/bin/env bun
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import katex from "katex";
import { clone, extract as extractTex, write, read, norm } from "./lib.js";

export const render = (tex) => {
  const raw = katex.renderToString(tex, { output: "mathml", displayMode: true, strict: "ignore" }),
    match = raw.match(/^<span class="katex">(.*)<\/span>$/);
  let mml = match ? match[1] : raw;
  let output = mml
    .replace(/\s*class="[^"]*"/g, "")
    .replace(/\s*id="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return output.replace(/>\s+</g, "><").trim();
};

export const extract = async () => {
  const katex_dir = join(import.meta.dirname, "KaTeX"),
    repo_url = "https://github.com/kaTeX/KaTeX.git";

  await clone("KaTeX", repo_url, katex_dir);

  const test_dir = join(katex_dir, "test"),
    contrib_dir = join(katex_dir, "contrib"),
    all_tex = new Set(),
    func_names = [
      "getMathML",
      "renderToString",
      "expect",
      "getParsed",
      "getBuilt",
      "toParseLike",
      "toBuildLike",
    ];

  const scan = (path) => {
    try {
      const stat = statSync(path);
      if (stat.isDirectory()) {
        readdirSync(path).forEach((file) => scan(join(path, file)));
      } else if (path.endsWith("-spec.ts") || path.endsWith("-spec.js")) {
        const content = readFileSync(path, "utf8"),
          extracted = extractTex(content, func_names);
        extracted.forEach((tex) => all_tex.add(tex));
      }
    } catch {
      // 忽略扫描与读取错误
    }
  };

  scan(test_dir);
  scan(contrib_dir);

  return Array.from(all_tex);
};

if (import.meta.main) {
  const workspace_dir = join(import.meta.dirname, ".."),
    raw_tex_list = await extract(),
    existing_tex = read(workspace_dir),
    filtered_tex = raw_tex_list.filter((tex) => !existing_tex.has(norm(tex)));

  console.log("Extracted " + raw_tex_list.length + " unique TeX strings from KaTeX.");
  console.log("Filtered down to " + filtered_tex.length + " after deduplication.");

  const count = await write(filtered_tex, "katex.yml", workspace_dir, render);
  console.log("Successfully generated " + count + " KaTeX test cases.");
}
