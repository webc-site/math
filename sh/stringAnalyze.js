#!/usr/bin/env bun
import { parseSync } from "oxc-parser";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import minify from "../minify.js";
import ROOT from "./ROOT.js";

const lib_file = join(ROOT, "lib", "mathml.js"),
  walkAst = (node, callback) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; ++i) {
        walkAst(node[i], callback);
      }
      return;
    }
    callback(node);
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        walkAst(node[key], callback);
      }
    }
  },
  analyzeStrings = async () => {
    // 1. 运行 minify.js 生成最新的 lib/lib.js
    await minify(ROOT);

    // 2. 读取 lib/lib.js
    const code = await readFile(lib_file, "utf8"),
      ast = parseSync(lib_file, code),
      counts = new Map();

    // 3. 遍历 AST 并统计字符串出现频率
    walkAst(ast.program, (node) => {
      if (node.type === "Literal" && typeof node.value === "string") {
        const str = node.value,
          info = counts.get(str) || { count: 0, length: str.length };
        info.count += 1;
        counts.set(str, info);
      }
    });

    // 4. 筛选出现次数超过 3 次的字符串并计算可节约空间
    const results = [];
    let total_saved = 0;

    for (const [str, info] of counts.entries()) {
      if (info.count > 3) {
        const original_size = info.count * (info.length + 2),
          const_size = info.length + 6,
          usage_size = info.count * 2,
          saved = original_size - (const_size + usage_size);

        if (saved > 0) {
          results.push({
            str,
            count: info.count,
            length: info.length,
            saved,
          });
          total_saved += saved;
        }
      }
    }

    // 排序：按节约字节数降序
    results.sort((a, b) => b.saved - a.saved);

    // 5. 输出结果
    console.log("\n--- 重复出现超过 3 次的字符串统计 ---");
    console.log(String("字符串").padEnd(30) + " | 出现次数 | 长度 | 估算可节约空间 (Bytes)");
    console.log("-".repeat(75));

    for (const item of results) {
      const display_str =
        item.str.length > 27
          ? JSON.stringify(item.str.slice(0, 24)) + "..."
          : JSON.stringify(item.str);
      console.log(
        display_str.padEnd(30) +
          " | " +
          String(item.count).padStart(8) +
          " | " +
          String(item.length).padStart(4) +
          " | " +
          String(item.saved).padStart(21),
      );
    }

    console.log("-".repeat(75));
    console.log("预计定义为常量后总共可节约 JS 空间: " + total_saved + " 字节");
  };

await analyzeStrings();
