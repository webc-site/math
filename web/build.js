#!/usr/bin/env node
// 生成网站所需的浏览器产物：打包后的转换器、语言清单、实测体积/速度数据。
// web/ 其余文件均为静态资源，可直接部署到 Cloudflare Pages（构建命令 node web/build.js，输出目录 web）。
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import CODE from "../demo/webc/I18n/CODE.js";
import NAME from "../demo/webc/I18n/NAME.js";
import convert from "../src/mermaid.js";

const DIR = import.meta.dirname;

// 打包转换器
const res = await build({
    entryPoints: [join(DIR, "../src/mermaid.js")],
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
  }),
  code = res.outputFiles[0].text;
writeFileSync(join(DIR, "mermaid.js"), code);

// 语言清单（全部 75 种）
writeFileSync(join(DIR, "langs.json"), JSON.stringify(CODE.map((c, i) => [c, NAME[i]])));

// 实测速度：渲染 sequence 图（maid/beautiful-mermaid/mermaid 与本项目都支持，功能相同口径）
const one =
  "sequenceDiagram\n  Alice->>Bob: Hello Bob\n  Bob-->>Alice: Hi Alice\n  Alice->>Bob: How are you?";
for (let i = 0; i < 2000; ++i) convert(one);
const N = 60000,
  t0 = performance.now();
for (let i = 0; i < N; ++i) convert(one);
const ops = Math.round(N / ((performance.now() - t0) / 1000));

// 体积/速度数据。libs 为三个对手库「自包含浏览器包(含依赖) + gzip」实测值
// （esbuild bundle，platform=browser；mermaid 用官方 mermaid.min.js）。本项目 gzip 实时测得。
const gzip = gzipSync(code).length;
writeFileSync(
  join(DIR, "stats.json"),
  JSON.stringify({
    gzip,
    ops,
    libs: [
      ["@webc.site/mermaid", gzip],
      ["@probelabs/maid", 139307],
      ["beautiful-mermaid", 495196],
      ["mermaid", 974866],
    ],
    // sequence 渲染吞吐(ops/s)。ours 实时测得；其余为实测：maid/beautiful-mermaid 在 Node(DOM-free)，
    // mermaid 必须在浏览器(依赖 getBBox 布局)故在浏览器实测。
    speedLibs: [
      ["@webc.site/mermaid", ops],
      ["beautiful-mermaid", 150678],
      ["@probelabs/maid", 51990],
      ["mermaid", 56],
    ],
  }),
);

console.log(
  "web: built mermaid.js (" +
    gzip +
    "B gzip), langs.json (" +
    CODE.length +
    "), stats.json (" +
    ops +
    " ops/s)",
);
