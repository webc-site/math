#!/usr/bin/env node
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { clone, writeCases } from "./mlib.js";
import maid from "./maid.js";
import bmermaid from "./bmermaid.js";
import mmjs from "./mmjs.js";

const ROOT = import.meta.dirname,
  TEST_DIR = join(ROOT, "..", "test"),
  SOURCES = [
    ["maid", "https://github.com/probelabs/maid", maid],
    ["beautiful-mermaid", "https://github.com/lukilabs/beautiful-mermaid", bmermaid],
    ["mermaid", "https://github.com/mermaid-js/mermaid", mmjs],
  ],
  pad = (s, n) => String(s).padStart(n);

const run = () => {
  const all = [],
    seen = new Set();
  // 顺序去重：maid 优先（带 valid/invalid 与错误码），其后两者补充有效样本
  for (const [dir, url, extract] of SOURCES) {
    clone(url, join(ROOT, dir));
    let added = 0;
    for (const e of extract(join(ROOT, dir))) {
      if (!e.source || e.type === "other" || seen.has(e.source)) continue;
      seen.add(e.source);
      all.push(e);
      ++added;
    }
    console.log(dir + ": +" + added + " cases");
  }

  mkdirSync(TEST_DIR, { recursive: true });
  const summary = writeCases(all, TEST_DIR).sort((a, b) => b[1] - a[1]);

  console.log("\n" + "type".padEnd(15) + pad("total", 6) + pad("valid", 7) + pad("invalid", 9));
  let tt = 0,
    tv = 0,
    ti = 0;
  for (const [type, total, valid, invalid] of summary) {
    console.log(type.padEnd(15) + pad(total, 6) + pad(valid, 7) + pad(invalid, 9));
    tt += total;
    tv += valid;
    ti += invalid;
  }
  console.log("TOTAL".padEnd(15) + pad(tt, 6) + pad(tv, 7) + pad(ti, 9));
};

run();
