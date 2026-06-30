#!/usr/bin/env node
// 测试 harness：遍历指定类型的 test/<type>.yml（默认取 src/types.js 已登记的类型）。
// 有效样本必须渲染出 <svg>，无效样本必须被拒绝（抛错）。
// 用法：node test/render.js [type...]    末行输出 JSON 汇总，供 loop 解析。
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import convert from "../src/mermaid.js";
import TYPES from "../src/types.js";

const DIR = import.meta.dirname,
  types = process.argv.slice(2).length ? process.argv.slice(2) : TYPES;

const run = () => {
  const stat = {},
    fails = [];
  let pass = 0,
    fail = 0;
  for (const type of types) {
    const rows = load(readFileSync(join(DIR, type + ".yml"), "utf8"));
    let tp = 0,
      tf = 0;
    rows.forEach(([src, meta], i) => {
      let svg = "",
        err = "";
      try {
        svg = convert(src);
      } catch (e) {
        err = e.message;
      }
      const ok = meta.valid ? !err && svg.includes("<svg") : !!err;
      if (ok) {
        ++tp;
      } else {
        ++tf;
        if (fails.length < 25) {
          fails.push(type + "#" + i + " want=" + (meta.valid ? "render" : "reject") + " got=" + (err || "rendered") + " :: " + src.split("\n")[0]);
        }
      }
    });
    stat[type] = [tp, tf];
    pass += tp;
    fail += tf;
  }
  for (const t of types) console.log(t.padEnd(14) + "pass " + stat[t][0] + "  fail " + stat[t][1]);
  if (fails.length) console.log("\nFAILURES:\n" + fails.join("\n"));
  console.log("\nPASS " + pass + " / FAIL " + fail);
  console.log("JSON " + JSON.stringify({ pass, fail, byType: stat }));
  if (fail) process.exit(1);
};

run();
