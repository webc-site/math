#!/usr/bin/env node
// 基准：按需分包——每种图类型单独打包+gzip（src/<type>.js 自包含），再测其渲染速度。
// 另给出 full（dispatcher + 全部已注册类型）的总包体积。
// 用法：node test/bench.js [type...]   末行输出 JSON，供 loop 解析。
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import convert from "../src/mermaid.js";
import TYPES from "../src/types.js";

const DIR = import.meta.dirname,
  SRC = join(DIR, "../src"),
  types = process.argv.slice(2).length ? process.argv.slice(2) : TYPES;

const bundleGzip = async (entry) => {
    const res = await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
    });
    return gzipSync(res.outputFiles[0].text).length;
  },
  speed = (type) => {
    const corpus = load(readFileSync(join(DIR, type + ".yml"), "utf8"))
      .filter(([, m]) => m.valid)
      .map(([s]) => s);
    if (!corpus.length) return 0;
    for (let i = 0; i < 1000; ++i) corpus.forEach((s) => convert(s));
    const N = 20000,
      t0 = performance.now();
    for (let i = 0; i < N; ++i) {
      for (const s of corpus) convert(s);
    }
    return Math.round((N * corpus.length) / ((performance.now() - t0) / 1000));
  };

const out = {};
for (const type of types) {
  const entry = join(SRC, type + ".js");
  if (!existsSync(entry)) continue;
  out[type] = { gzip: await bundleGzip(entry), ops: speed(type) };
  console.log(type.padEnd(14) + out[type].gzip + " B gzip   " + out[type].ops + " ops/s");
}
const full = await bundleGzip(join(SRC, "mermaid.js"));
console.log("full (dispatcher + " + TYPES.length + " types): " + full + " B gzip");
console.log("JSON " + JSON.stringify({ perType: out, full }));
