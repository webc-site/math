#!/usr/bin/env bun
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import mathjax from "mathjax";
import { clone, extract as extractTex, write, read, norm } from "./lib.js";

let MathJax;
const getMathJax = async () => {
  if (!MathJax) {
    MathJax = await mathjax.init({
      loader: { load: ["input/tex"] },
    });
  }
  return MathJax;
};

export const render = async (tex) => {
  const mj = await getMathJax();
  let mml = await mj.tex2mmlPromise(tex, { display: true });
  mml = mml
    .replace(/\s*data-latex="[^"]*"/g, "")
    .replace(/\s*class="[^"]*"/g, "")
    .replace(/\s*id="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = mml.match(/^<math[^>]*>(.*)<\/math>$/),
    inner = match ? match[1].trim() : mml,
    esc_tex = tex.replace(/[&<>"]/g, (m) =>
      m === "&" ? "&amp;" : m === "<" ? "&lt;" : m === ">" ? "&gt;" : "&quot;",
    );
  let output =
    '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow>' +
    inner +
    '</mrow><annotation encoding="application/x-tex">' +
    esc_tex +
    "</annotation></semantics></math>";
  return output.replace(/>\s+</g, "><").trim();
};

export const extract = async () => {
  const mathjax_dir = join(import.meta.dirname, "MathJax-src"),
    repo_url = "https://github.com/mathjax/MathJax-src.git";

  await clone("MathJax-src", repo_url, mathjax_dir);

  const mathjax_tex_dir = join(mathjax_dir, "testsuite/tests/input/tex"),
    all_tex = new Set(),
    func_names = ["tex2mml", "expectTexError"];

  try {
    const files = readdirSync(mathjax_tex_dir);
    files.forEach((file) => {
      if (file.endsWith(".test.ts") || file.endsWith(".test.js")) {
        const file_path = join(mathjax_tex_dir, file);
        try {
          const content = readFileSync(file_path, "utf8"),
            extracted = extractTex(content, func_names);
          extracted.forEach((tex) => all_tex.add(tex));
        } catch {
          // 忽略读取与解析错误
        }
      }
    });
  } catch {
    // 忽略读取与解析错误
  }

  return Array.from(all_tex);
};

if (import.meta.main) {
  const workspace_dir = join(import.meta.dirname, ".."),
    raw_tex_list = await extract(),
    existing_tex = read(workspace_dir),
    filtered_tex = raw_tex_list.filter((tex) => !existing_tex.has(norm(tex)));

  console.log("Extracted " + raw_tex_list.length + " unique TeX strings from MathJax.");
  console.log("Filtered down to " + filtered_tex.length + " after deduplication.");

  const count = await write(filtered_tex, "mathjax.yml", workspace_dir, render);
  console.log("Successfully generated " + count + " MathJax test cases.");
}
