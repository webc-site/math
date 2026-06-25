#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import ERR from "@3-/log/ERR.js";
import WARN from "@3-/log/WARN.js";
import FORMULAS from "../../demo/const/formulas.js";
import convert from "../../lib/mathml.js";
import { ROOT, pkg, getOursSize, runOursSpeed, newTable } from "./util.js";

const HISTORY_PATH = join(ROOT, "sh", "bench", "history.yml");

export const run = async (options = {}) => {
  const oursSize = getOursSize();
  const ops_ours = runOursSpeed(convert, FORMULAS);

  const dateStr = new Date().toISOString().slice(0, 10);
  const current = {
    version: pkg.version,
    date: dateStr,
    raw: oursSize.raw,
    gz: oursSize.gz,
    speed: ops_ours,
  };

  let history = [];
  if (existsSync(HISTORY_PATH)) {
    try {
      history = yaml.load(readFileSync(HISTORY_PATH, "utf8")) || [];
    } catch (e) {
      WARN("⚠️ 解析 history.yml 失败，正在重置历史数据。", e.message);
    }
  }

  if (options.update || history.length === 0) {
    const existingIdx = history.findIndex((item) => item.version === pkg.version);
    if (existingIdx !== -1) {
      history[existingIdx] = current;
    } else {
      history.push(current);
    }

    // Retain only the last 3 years of history
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const filtered = history.filter((item) => {
      if (!item.date) return true;
      return new Date(item.date) >= threeYearsAgo;
    });

    writeFileSync(HISTORY_PATH, yaml.dump(filtered), "utf8");
    console.log("✅ 基准数据已保存至: " + HISTORY_PATH);
    console.log(yaml.dump(current));
    return;
  }

  // Find the baseline to compare against. Preferably the latest entry with a different version,
  // falling back to the last entry in the list.
  let baseline = history[history.length - 1];
  for (let i = history.length - 1; i >= 0; --i) {
    if (history[i].version !== pkg.version) {
      baseline = history[i];
      break;
    }
  }

  const raw_diff = current.raw - baseline.raw,
    gz_diff = current.gz - baseline.gz,
    speed_diff = current.speed - baseline.speed,
    raw_percent = ((raw_diff / baseline.raw) * 100).toFixed(2),
    gz_percent = ((gz_diff / baseline.gz) * 100).toFixed(2),
    speed_percent = ((speed_diff / baseline.speed) * 100).toFixed(2);

  const table = newTable(["指标", "单位", "基准版本", "当前版本", "偏差", "偏差 %"]),
    data = [
      ["原始体积", "KB", baseline.raw, current.raw, raw_diff, raw_percent, true],
      ["Gzip 体积", "KB", baseline.gz, current.gz, gz_diff, gz_percent, true],
      ["每秒运行次数", "ops/s", baseline.speed, current.speed, speed_diff, speed_percent, false],
    ];

  for (const [name, unit, base, curr, diff, percent, is_size] of data) {
    const base_val = is_size ? (base / 1024).toFixed(2) : base.toLocaleString(),
      curr_val = is_size ? (curr / 1024).toFixed(2) : curr.toLocaleString(),
      formatted_diff = is_size ? (diff / 1024).toFixed(2) : diff.toLocaleString(),
      diff_val =
        diff === 0 || Number(formatted_diff) === 0 ? "0" : (diff > 0 ? "+" : "") + formatted_diff,
      pct_val = diff === 0 || Number(percent) === 0 ? "0.00" : (diff > 0 ? "+" : "") + percent;
    table.push([name, unit, base_val, curr_val, diff_val, pct_val]);
  }

  console.log("\n回归测试结果对比基准 (" + baseline.version + "，" + baseline.date + ")\n");
  console.log(table.toString());

  let failed = false;
  if (gz_diff > 0) {
    ERR("\n❌ 回归警告：Gzip 体积增加了 " + gz_diff + " 字节！");
    failed = true;
  }
  if (speed_diff < 0 && Math.abs(speed_diff / baseline.speed) > 0.15) {
    WARN("\n⚠️ 警告：生成速度下降了 " + Math.abs(speed_percent) + "%（可能存在性能回归）。");
  }

  if (failed) {
    ERR("\n若要使用当前数据更新基准，请运行: bun sh/bench/self.js --update\n");
    process.exit(1);
  }
};

if (import.meta.main) {
  const update = process.argv.includes("--update");
  await run({ update });
}
