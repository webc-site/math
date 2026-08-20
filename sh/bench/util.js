import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import envPaths from "env-paths";
import rJson from "@3-/read/rJson.js";
import Table from "cli-table3";
import ROOT_DIR from "../ROOT.js";

export const ROOT = ROOT_DIR;
export const CACHE_DIR = envPaths("webc-math-benchmark").cache;

export const newTable = (head) =>
  new Table({
    head,
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: "   ",
    },
    style: { "padding-left": 0, "padding-right": 0, head: [] },
  });

export const pkg = rJson(join(ROOT, "package.json"));
const local_path = join(ROOT, "lib", "mathml.js");

export const gzSize = (buf) =>
  typeof Bun !== "undefined" ? Bun.gzipSync(buf).byteLength : gzipSync(buf).byteLength;

export const cleanVersion = (ver) => ver.replace(/^[^\d]+/, "");

export const getOursSize = () => {
  const code = readFileSync(local_path);
  return {
    raw: code.byteLength,
    gz: gzSize(code),
  };
};

export const runOursSpeed = (convert, formulas) => {
  // Warmup
  for (let i = 0; i < 10; ++i) {
    for (const f of formulas) {
      try {
        convert(f, true);
      } catch {}
    }
  }
  const start = performance.now();
  for (let i = 0; i < 1000; ++i) {
    for (const f of formulas) {
      try {
        convert(f, true);
      } catch {}
    }
  }
  const duration = performance.now() - start;
  return Math.round((1000 * formulas.length) / (duration / 1000));
};
