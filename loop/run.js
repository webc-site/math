#!/usr/bin/env node
// 全自动开发循环（考察点 #6）：用 opencode SDK 驱动编码 agent，逐个把 mermaid 图类型
// 「磨」到测试全过 + 最小最快。test/*.yml 是机器可判的 oracle，闭环全自动，无需人工喂提示词。
//
// 运行：npm i @opencode-ai/sdk && OPENCODE_MODEL=anthropic/claude-opus-4-8 node loop/run.js [type...]
//   不带参数：自动从 test/*.yml 里挑「已抽取但未实现」的类型，按可行性优先级逐个做。
//
// 设计要点：
//   · 循环体 = 测试(oracle) → 把失败喂回 agent → agent 改 src/ → 再测；绿了再进优化子循环。
//   · 停机条件全在本脚本里（确定性）：测试全绿 且 连续 3 次优化无更优 size/speed。
//   · agent 步骤可替换（opencode / Claude Code Agent SDK 同理），其余编排与判定与具体 agent 无关。

import { createOpencode } from "@opencode-ai/sdk";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import TYPES from "../src/types.js";

const ROOT = join(import.meta.dirname, ".."),
  MAX_FIX = 12, // 单类型修复轮数上限，防失控
  MODEL = process.env.OPENCODE_MODEL || "anthropic/claude-opus-4-8",
  // A 类（定位式布局，最小最快友好）优先，其后才是需要图布局的 B 类
  PRIORITY = [
    "xychart", "sequence", "gantt", "timeline", "journey", "quadrant",
    "radar", "packet", "info", "kanban", "venn", "sankey", "mindmap",
    "git", "er", "class", "state", "flowchart", "block", "c4",
    "architecture", "requirement",
  ];

// 跑本仓库脚本，回收 stdout（失败也回收，便于解析末行 JSON）
const sh = (args) => {
    try {
      return execFileSync("node", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 24 });
    } catch (e) {
      return (e.stdout || "") + (e.stderr || "");
    }
  },
  lastJson = (out, key) => {
    const line = out.split("\n").reverse().find((l) => l.startsWith(key));
    return line ? JSON.parse(line.slice(key.length).trim()) : null;
  },
  test = (type) => lastJson(sh(["test/render.js", type]), "JSON") || { pass: 0, fail: -1 },
  bench = (type) => (lastJson(sh(["test/bench.js", type]), "JSON") || { perType: {} }).perType[type] || { gzip: 1e9, ops: 0 },
  failsText = (type) => {
    const out = sh(["test/render.js", type]),
      i = out.indexOf("FAILURES:");
    return i < 0 ? "" : out.slice(i, out.indexOf("\n\nPASS"));
  },
  // size 为主、speed 为辅的帕累托判定：更小、或同等大小下更快，才算更优
  better = (b, base) => b.gzip < base.gzip || (b.gzip === base.gzip && b.ops > base.ops),
  // 待办类型：已抽取(test/*.yml)但未在 src/types.js 登记的，按优先级与样本量排序
  pending = () => {
    const done = new Set(TYPES),
      files = readdirSync(join(ROOT, "test")).filter((f) => f.endsWith(".yml")).map((f) => f.slice(0, -4)),
      todo = files.filter((t) => !done.has(t)),
      count = (t) => load(readFileSync(join(ROOT, "test", t + ".yml"), "utf8")).length,
      rank = (t) => (PRIORITY.indexOf(t) + 1 || 999) * 1e6 - count(t);
    return todo.sort((a, b) => rank(a) - rank(b));
  };

const ask = async (client, id, text) => {
  await client.session.prompt({ path: { id }, body: { parts: [{ type: "text", text }] } });
};

const IMPL_PROMPT = (type) =>
  "实现 mermaid 「" + type + "」图 → SVG。要求：\n" +
  "· 新建 src/" + type + ".js，`export default (src) => svgString`，纯函数、无第三方依赖、遵循 AGENTS.md 代码规范；\n" +
  "· 在 src/mermaid.js 的 RENDER 注册表加一行 [正则, 渲染器]，并把 \"" + type + "\" 加入 src/types.js；\n" +
  "· 目标：`node test/render.js " + type + "` 全过——valid 样本必须产出含 <svg> 的字符串，invalid 样本必须抛错；\n" +
  "· 追求最小最快：代码尽量小、渲染尽量快；不要破坏其它类型的测试。\n" +
  "测试样本在 test/" + type + ".yml（[源码, {valid, errors?}] 列表）。";

// 单类型主流程：先磨到绿，再优化到 size/speed 连续 3 次无改善
const grind = async (client, id, type) => {
  console.log("\n========== " + type + " ==========");
  await ask(client, id, IMPL_PROMPT(type));

  for (let round = 0; round < MAX_FIX; ++round) {
    const r = test(type);
    console.log("[" + type + "] round " + round + ": pass=" + r.pass + " fail=" + r.fail);
    if (r.fail === 0) break;
    await ask(client, id,
      "仍未通过（" + r.fail + " 个失败）。修正 src/" + type + ".js 使全部通过，勿破坏其它类型：\n" + failsText(type));
    if (round === MAX_FIX - 1) {
      console.log("[" + type + "] 达到修复轮数上限，跳过优化");
      return false;
    }
  }

  let base = bench(type),
    noImprove = 0;
  console.log("[" + type + "] 绿了 → 优化基线 " + base.gzip + "B / " + base.ops + " ops/s");
  while (noImprove < 3) {
    await ask(client, id,
      "全部测试已过。当前 " + base.gzip + "B gzip、" + base.ops + " ops/s。\n" +
      "在不破坏任何测试的前提下，尝试一处「结构性」改动让它更小或更快（更小优先）。只改 src/" + type + ".js。");
    if (test(type).fail !== 0) {
      await ask(client, id, "上次改动破坏了测试，请回退到可通过的版本。");
      continue;
    }
    const b = bench(type);
    if (better(b, base)) {
      console.log("[" + type + "] ✓ 更优 " + base.gzip + "→" + b.gzip + "B, " + base.ops + "→" + b.ops);
      base = b;
      noImprove = 0;
    } else {
      ++noImprove;
      console.log("[" + type + "] ✗ 无改善 (" + noImprove + "/3) " + b.gzip + "B / " + b.ops);
    }
  }
  console.log("[" + type + "] 收敛：" + base.gzip + "B gzip / " + base.ops + " ops/s");
  return true;
};

const run = async () => {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : pending();
  console.log("待做类型：" + targets.join(", "));

  const { client, server } = await createOpencode({ config: { model: MODEL } });

  for (const type of targets) {
    // 每类型起一个子会话，上下文干净
    const { data: s } = await client.session.create({ body: { title: "mermaid " + type } });
    await grind(client, s.id, type);
  }

  await server.close();
  console.log("\n全部完成。");
};

await run();
