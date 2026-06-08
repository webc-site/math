import { readFileSync } from "node:fs";
import { join } from "node:path";
import render from "@3-/mdt/render.js";
import write from "@3-/write";
import ROOT from "../ROOT.js";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\-\u4e00-\u9fa5]/g, "")
    .replace(/\s+/g, "-");

const genToc = (body_path, toc_path) => {
  const content = readFileSync(body_path, "utf8"),
    lines = content.split("\n"),
    toc_lines = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length,
        title = match[2].trim(),
        slug = slugify(title),
        indent = "  ".repeat(level - 2);
      toc_lines.push(indent + "- [" + title + "](#" + slug + ")");
    }
  }
  write(toc_path, toc_lines.join("\n") + "\n");
};

const readme = async (dir) => {
  const mdt_path = join(dir, "README.mdt"),
    md_path = join(dir, "README.md"),
    lib_md_path = join(dir, "lib", "README.md");
  const en_mdt = join(dir, "readme", "en", "README.mdt"),
    en_body = join(dir, "readme", "en", "README.md"),
    en_toc = join(dir, "readme", "en", "README.toc.md"),
    zh_mdt = join(dir, "readme", "zh", "README.mdt"),
    zh_body = join(dir, "readme", "zh", "README.md"),
    zh_toc = join(dir, "readme", "zh", "README.toc.md");

  write(en_body, await render(en_mdt));
  write(zh_body, await render(zh_mdt));

  genToc(en_body, en_toc);
  genToc(zh_body, zh_toc);

  const content = await render(mdt_path);
  write(md_path, content);
  write(lib_md_path, content);
};

export default readme;

if (import.meta.main) {
  await readme(process.argv[2] || ROOT);
}
