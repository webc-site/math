import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dump } from "js-yaml";

// 浅克隆仓库，已存在则跳过
export const clone = (url, dir) => {
  if (!existsSync(dir)) {
    execFileSync("git", ["clone", "--depth=1", url, dir], { stdio: "inherit" });
  }
};

// 按最小公共缩进对齐（HTML/TS 内嵌的图源码常带统一缩进）
const dedent = (src) => {
    const lines = src.replace(/\t/g, "  ").split(/\r?\n/),
      indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length),
      min = indents.length ? Math.min(...indents) : 0;
    return lines.map((l) => l.slice(min)).join("\n");
  },
  // 去缩进、去行尾空白、去首尾空行，作为归一化后的图源码
  norm = (src) =>
    dedent(src)
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+$/, ""))
      .join("\n")
      .replace(/^\n+|\n+$/g, "");

export { norm };

// 取首个有效行：跳过 frontmatter、空行、%% 注释与 %%{init}%% 指令
const head = (src) => {
  const lines = src.split(/\r?\n/),
    out = [];
  let in_fm = false,
    fm_done = false;
  for (let i = 0; i < lines.length; ++i) {
    const t = lines[i].trim();
    if (!fm_done && out.length === 0 && !in_fm && t === "---") {
      in_fm = true;
      continue;
    }
    if (in_fm) {
      if (t === "---") {
        in_fm = false;
        fm_done = true;
      }
      continue;
    }
    if (!t || t.startsWith("%%")) continue;
    out.push(t);
    break;
  }
  return out[0] || "";
};

const TYPE_RE = [
  [/^(?:flowchart|graph)\b/, "flowchart"],
  [/^sequenceDiagram\b/, "sequence"],
  [/^classDiagram(?:-v2)?\b/, "class"],
  [/^stateDiagram(?:-v2)?\b/, "state"],
  [/^erDiagram\b/, "er"],
  [/^pie\b/, "pie"],
  [/^gantt\b/, "gantt"],
  [/^journey\b/, "journey"],
  [/^gitGraph\b/, "git"],
  [/^mindmap\b/, "mindmap"],
  [/^timeline\b/, "timeline"],
  [/^quadrantChart\b/, "quadrant"],
  [/^xychart(?:-beta)?\b/, "xychart"],
  [/^block(?:-beta)?\b/, "block"],
  [/^C4(?:Context|Container|Component|Dynamic|Deployment)\b/, "c4"],
  [/^requirementDiagram\b/, "requirement"],
  [/^sankey(?:-beta)?\b/, "sankey"],
  [/^architecture(?:-beta)?\b/, "architecture"],
];

export const classify = (src) => {
  const h = head(src);
  for (const [re, name] of TYPE_RE) {
    if (re.test(h)) return name;
  }
  // 未列入别名表的（多为较新的 *-beta 图）：取关键字首段，去掉 -beta/-v 后缀
  const kw = (h.match(/^[A-Za-z][\w-]*/) || [""])[0].replace(/-(?:beta|v\d+)$/, "").split("-")[0];
  return /^[A-Za-z][A-Za-z0-9]*$/.test(kw) ? kw : "other";
};

// 按类型分组写入 test/<type>.yml，返回 [类型, 总数, 有效, 无效] 汇总
export const writeCases = (entries, test_dir) => {
  const by_type = {},
    summary = [];
  for (const e of entries) {
    (by_type[e.type] ||= []).push(e);
  }
  for (const [type, list] of Object.entries(by_type)) {
    const rows = list.map(({ source, from, valid, errors }) => {
        const meta = { from, valid };
        if (!valid && errors && errors.length) meta.errors = errors;
        return [source, meta];
      }),
      valid = list.filter((e) => e.valid).length;
    writeFileSync(join(test_dir, type + ".yml"), dump(rows, { lineWidth: -1 }), "utf8");
    summary.push([type, list.length, valid, list.length - valid]);
  }
  return summary;
};
