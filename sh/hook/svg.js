#!/usr/bin/env bun

import { $ } from "@3-/zx";
import read from "@3-/read";
import write from "@3-/write";
import { optimize } from "svgo";

const minifySvgContent = (content) => {
  try {
    return optimize(content, {
      multipass: true,
      plugins: ["preset-default", "removeViewBox"],
    }).data;
  } catch (e) {
    console.error(e);
    return content;
  }
};

export const DATA_URI_REGEX = /data:image\/svg\+xml,([^"')\s\\]+)/g,
  SVG_TAG_REGEX = /<svg\b[^>]*>[\s\S]*?<\/svg>/g,
  stagedFiles = async () => {
    try {
      const res = await $(["git diff --cached --name-only --diff-filter=ACM"]);
      return res.toString().trim().split("\n").filter(Boolean);
    } catch {
      return [];
    }
  };

const args = process.argv.slice(2),
  minifySvgFile = (file) => {
    const original = read(file);
    if (!original) {
      return false;
    }
    const data = minifySvgContent(original);
    if (data && data.length < original.length) {
      write(file, data);
      const saved = original.length - data.length,
        ratio = ((saved / original.length) * 100).toFixed(2);
      console.log("[" + ratio + "%] 压缩: " + file + " (减少 " + saved + " 字节)");
      return true;
    }
    return false;
  },
  main = async () => {
    const files = args.length ? args : await stagedFiles();
    let changed = false;

    for (const file of files) {
      if (file.endsWith(".svg")) {
        if (minifySvgFile(file)) {
          changed = true;
        }
      }
    }

    if (changed && !args.length) {
      try {
        await $(["git add -u"]);
      } catch (e) {
        console.error("git add failed:", e);
      }
    }
  };

if (import.meta.main) {
  await main();
}
