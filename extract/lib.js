import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { $ } from "zx";
import { load, dump } from "js-yaml";
import convert from "../src/md.js";
import compile from "../src/mathml.js";

export const isSupported = (tex) => {
  for (let i = 0; i < tex.length; ++i) {
    if (tex.charCodeAt(i) > 127) {
      return false;
    }
  }
  if (/^\s*[_^]/.test(tex)) {
    return false;
  }
  if (
    tex.includes("%") ||
    tex.includes("~") ||
    tex.includes("$") ||
    tex.includes("'") ||
    tex.includes("`") ||
    tex.includes('"') ||
    tex.includes(";")
  ) {
    return false;
  }
  if (/<[a-zA-Z]/.test(tex)) {
    return false;
  }
  if (/[=<>!]{2,}/.test(tex) || /<=|>=|!=|=<|:=/.test(tex)) {
    return false;
  }
  if (/{[^{}]*\.[^{}]*}/.test(tex)) {
    return false;
  }
  if (/{[^{}]*,/.test(tex) || /{[^{}]*{/.test(tex) || /}[^{}]*}/.test(tex)) {
    return false;
  }
  if (tex.includes("\\begin")) {
    const env_matches = tex.match(/\\begin\s*{([^}]+)}/g) || [];
    const allowed_envs = new Set([
      "matrix",
      "pmatrix",
      "bmatrix",
      "vmatrix",
      "Vmatrix",
      "cases",
      "array",
    ]);
    for (const m of env_matches) {
      const env = m.match(/\\begin\s*{([^}]+)}/)[1];
      if (!allowed_envs.has(env)) {
        return false;
      }
    }
  }
  const clean_tex = tex.replace(/\\\\/g, "\\doublebackslash");
  const backslash_count = (clean_tex.match(/\\/g) || []).length,
    matches = clean_tex.match(/\\(?:[a-zA-Z]+|.)/g) || [];
  if (backslash_count !== matches.length) {
    return false;
  }
  if (tex.includes("\\frac")) {
    const frac_matches = tex.match(/\\frac/g) || [],
      valid_frac = tex.match(/\\frac\s*(?:{[^{}]+}\s*{[^{}]+})/g) || [];
    if (frac_matches.length !== valid_frac.length) {
      return false;
    }
  }
  if (tex.includes("\\sqrt")) {
    const sqrt_matches = tex.match(/\\sqrt/g) || [],
      valid_sqrt =
        tex.match(
          /\\sqrt\s*(?:\[[^\]]+\]\s*(?:{[^{}]+}|\\?[a-zA-Z0-9]+)|(?:{[^{}]+}|\\?[a-zA-Z0-9]+))/g,
        ) || [];
    if (sqrt_matches.length !== valid_sqrt.length) {
      return false;
    }
  }
  return true;
};

export const clone = async (name, url, target_dir) => {
  if (!existsSync(target_dir)) {
    console.log(name + " directory not found. Cloning...");
    await $`git clone --depth=1 ${url} ${target_dir}`;
  }
};

const parse = (raw) => {
  try {
    return new Function("return " + raw)();
  } catch {
    return null;
  }
};

export const extract = (content, func_names) => {
    const tex_set = new Set(),
      pattern = new RegExp(
        "(?:" +
          func_names.join("|") +
          ")\\s*\\(\\s*(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)(?:\\s*,|\\s*\\))",
        "g",
      ),
      tag_pattern = new RegExp(
        "(?:" + func_names.join("|") + "|r|toParseLike|toBuildLike)\\s*`([\\s\\S]*?)`",
        "g",
      );
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const raw_literal = match[1],
        tex_val = parse(raw_literal);
      if (tex_val && tex_val.length > 0 && tex_val.length < 100) {
        tex_set.add(tex_val);
      }
    }
    while ((match = tag_pattern.exec(content)) !== null) {
      const tex_val = match[1];
      if (tex_val && tex_val.length > 0 && tex_val.length < 100) {
        tex_set.add(tex_val);
      }
    }
    return Array.from(tex_set);
  },
  norm = (tex) => tex.trim().replace(/\s+/g, " "),
  read = (workspace_dir) => {
    const tex_set = new Set(),
      case_dir = join(workspace_dir, "test/case");
    if (!existsSync(case_dir)) {
      return tex_set;
    }
    const files = readdirSync(case_dir);
    files.forEach((file) => {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        const file_path = join(case_dir, file);
        try {
          const content = readFileSync(file_path, "utf8"),
            cases = load(content) || [];
          cases.forEach(([md]) => {
            if (md.startsWith("$$") && md.endsWith("$$")) {
              tex_set.add(norm(md.slice(2, -2)));
            } else if (md.startsWith("$") && md.endsWith("$")) {
              tex_set.add(norm(md.slice(1, -1)));
            } else {
              const block_matches = md.match(/\$\$(.*?)\$\$/gs) || [];
              block_matches.forEach((m) => {
                tex_set.add(norm(m.slice(2, -2)));
              });
              const clean_content = md.replace(/\$\$.*?\$\$/gs, ""),
                inline_matches = clean_content.match(/\$(.*?)\$/g) || [];
              inline_matches.forEach((m) => {
                tex_set.add(norm(m.slice(1, -1)));
              });
            }
          });
        } catch {
          // 忽略读取错误
        }
      }
    });
    return tex_set;
  },
  write = async (tex_list, file_name, workspace_dir, render_fn) => {
    const case_dir = join(workspace_dir, "test/case"),
      file_path = join(case_dir, file_name);
    if (!existsSync(case_dir)) {
      mkdirSync(case_dir, { recursive: true });
    }
    let cases = [];
    if (existsSync(file_path)) {
      try {
        const content = readFileSync(file_path, "utf8");
        cases = load(content) || [];
      } catch {
        // 忽略读取错误
      }
    }
    const case_map = new Map(cases);
    for (const tex of tex_list) {
      if (!isSupported(tex)) {
        continue;
      }
      const input = "$$" + tex + "$$";
      if (case_map.has(input)) {
        continue;
      }
      try {
        convert(input, compile);
        const output = await render_fn(tex);
        if (output.includes("<merror")) {
          continue;
        }
        case_map.set(input, output);
      } catch {
        // 忽略无效/不支持的公式
      }
    }
    const updated_cases = Array.from(case_map.entries());
    writeFileSync(file_path, dump(updated_cases), "utf8");
    return updated_cases.length;
  };
