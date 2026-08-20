#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import katex from "katex";
import mathjax from "mathjax";
import FORMULAS from "../../demo/const/formulas.js";
import convert from "../../lib/mathml.js";
import {
  CACHE_DIR,
  pkg,
  gzSize,
  cleanVersion,
  getOursSize,
  runOursSpeed,
  newTable,
} from "./util.js";
import { generate } from "./chart.js";

export const run = async () => {
  const messages = [],
    MathJax = await mathjax.init({
      loader: { load: ["input/tex"] },
    });

  const pkg_name = pkg.name,
    pkg_version = pkg.version,
    dev_deps = pkg.devDependencies || {},
    versions = {
      KaTeX: cleanVersion(dev_deps.katex || "0.17.0"),
      MathJax: cleanVersion(dev_deps.mathjax || "4.1.2"),
    };

  // 1. Size Comparison
  const oursSize = getOursSize();
  const size_results = [
    [pkg_name + " v" + pkg_version + " (Ours)", oursSize.raw, oursSize.gz, "1.0 ⭐️"],
  ];

  mkdirSync(CACHE_DIR, { recursive: true });

  for (const name of ["KaTeX", "MathJax"]) {
    const version = versions[name],
      cache_path = join(CACHE_DIR, name.toLowerCase() + "-" + version + ".js");

    let uint8;
    if (existsSync(cache_path)) {
      uint8 = readFileSync(cache_path);
    } else {
      const url =
        name === "KaTeX"
          ? "https://cdn.jsdelivr.net/npm/katex@" + version + "/dist/katex.min.js"
          : "https://cdn.jsdelivr.net/npm/mathjax@" +
            version +
            (version.startsWith("4") ? "/tex-mml-chtml.js" : "/es5/tex-mml-chtml.js");

      console.log("正在从 jsDelivr 获取 " + name + " v" + version + "...");
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("获取失败: " + url + " 状态码: " + response.status);
      }
      const buf = await response.arrayBuffer();
      uint8 = new Uint8Array(buf);
      writeFileSync(cache_path, uint8);
    }

    const raw = uint8.byteLength,
      gz = gzSize(uint8),
      ratio = (gz / oursSize.gz).toFixed(1);

    size_results.push([name, raw, gz, ratio]);
  }

  const size_table = newTable(["库", "单位", "原始体积", "Gzip 体积", "尺寸比"]);
  size_results.forEach(([name, raw, gz, ratio]) => {
    size_table.push([name, "KB", (raw / 1024).toFixed(2), (gz / 1024).toFixed(2), ratio]);
  });

  console.log("\n体积对比评测\n");
  console.log(size_table.toString());

  // Generate Size SVG
  const size_chart_data = size_results.map(([name, _raw, gz, ratio], idx) => {
    const is_ours = idx === 0;
    return {
      name: is_ours ? pkg_name : name,
      version: is_ours
        ? "v" + pkg_version
        : name === "KaTeX"
          ? "v" + versions.KaTeX
          : "v" + versions.MathJax,
      value: gz,
      label: (gz / 1024).toFixed(2) + " KB",
      ratio,
      is_ours,
    };
  });
  messages.push(generate("size.svg", size_chart_data, true, "x"));

  // 2. Speed Comparison
  const runKatex = () => {
    for (const f of FORMULAS) {
      try {
        katex.renderToString(f, { output: "mathml", displayMode: true, strict: "ignore" });
      } catch {}
    }
  };

  const runMathjax = async () => {
    for (const f of FORMULAS) {
      try {
        await MathJax.tex2mmlPromise(f, { display: true });
      } catch {}
    }
  };

  // Warmup KaTeX & MathJax
  for (let i = 0; i < 10; ++i) {
    runKatex();
    await runMathjax();
  }

  // Measure Ours
  const ops_ours = runOursSpeed(convert, FORMULAS);

  // Measure KaTeX
  let start = performance.now();
  for (let i = 0; i < 1000; ++i) {
    runKatex();
  }
  let duration = performance.now() - start;
  const ops_katex = Math.round((1000 * FORMULAS.length) / (duration / 1000));

  // Measure MathJax
  start = performance.now();
  for (let i = 0; i < 100; ++i) {
    await runMathjax();
  }
  duration = performance.now() - start;
  const ops_mathjax = Math.round((100 * FORMULAS.length) / (duration / 1000));

  const perf_results = [
    [pkg_name + " v" + pkg_version + " (Ours)", ops_ours, "1.0 ⭐️"],
    ["KaTeX", ops_katex, (ops_ours / ops_katex).toFixed(1)],
    ["MathJax", ops_mathjax, (ops_ours / ops_mathjax).toFixed(1)],
  ];

  const speed_table = newTable(["库", "单位", "每秒运行次数", "耗时比"]);
  perf_results.forEach(([name, ops, ratio]) => {
    speed_table.push([
      name,
      "ops/s",
      ops.toLocaleString(),
      ratio === "1.0 ⭐️" ? ratio : ratio + "x",
    ]);
  });

  console.log("\n生成速度对比评测 (使用 formulas.js)\n");
  console.log(speed_table.toString());

  // Generate Speed SVG
  const speed_chart_data = perf_results.map(([name, ops, ratio], idx) => {
    const is_ours = idx === 0;
    return {
      name: is_ours ? pkg_name : name,
      version: is_ours
        ? "v" + pkg_version
        : name === "KaTeX"
          ? "v" + versions.KaTeX
          : "v" + versions.MathJax,
      value: ops,
      label: ops >= 1000 ? (ops / 1000).toFixed(0) + "k ops/s" : ops + " ops/s",
      ratio,
      is_ours,
    };
  });
  messages.push(generate("speed.svg", speed_chart_data, false, "x slower"));
  console.log("\n生成 " + messages.join(" ") + "\n");
};

if (import.meta.main) {
  await run();
}
