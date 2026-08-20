#!/usr/bin/env bun
import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { load, dump } from "js-yaml";
import { minify } from "html-minifier";
import WARN from "@3-/log/WARN.js";
import { extract as extractKatex, render as renderKatex } from "./katex.js";
import { extract as extractMathjax, render as renderMathjax } from "./mathjax.js";
import { read, norm, isSupported } from "./lib.js";
import { normalize } from "../test/compare.test.js";
import convert from "../src/md.js";
import compile from "../src/mathml.js";

const classify = (tex) => {
    if (tex.includes("\\sqrt")) return "sqrt";
    if (tex.includes("\\frac")) return "frac";
    if (
      /(?:\\alpha|\\beta|\\gamma|\\theta|\\pi|\\delta|\\epsilon|\\zeta|\\eta|\\iota|\\kappa|\\lambda|\\mu|\\nu|\\xi|\\rho|\\sigma|\\tau|\\upsilon|\\phi|\\chi|\\psi|\\omega|\\Gamma|\\Delta|\\Theta|\\Lambda|\\Xi|\\Pi|\\Sigma|\\Upsilon|\\Phi|\\Psi|\\Omega|\\nabla|\\partial)(?![a-zA-Z])/.test(
        tex,
      )
    )
      return "greek";
    if (
      /(?:\\sin|\\cos|\\tan|\\log|\\lim|\\ln|\\exp|\\max|\\min|\\sup|\\inf|\\det|\\gcd|\\arcsin|\\arccos|\\arctan|\\sinh|\\cosh|\\tanh)(?![a-zA-Z])/.test(
        tex,
      )
    )
      return "func";
    if (
      /(?:\\le|\\ge|\\neq|\\ne|\\leq|\\geq|\\cdot|\\times|\\pm|\\div|\\to|\\dots|\\cdots|\\ldots|\\leftarrow|\\rightarrow|\\leftrightarrow|\\Leftarrow|\\Rightarrow|\\Leftrightarrow|\\approx|\\sim|\\cong|\\propto|\\forall|\\exists|\\in|\\notin|\\subset|\\supset|\\subseteq|\\supseteq|\\cup|\\cap|\\emptyset)(?![a-zA-Z])/.test(
        tex,
      )
    )
      return "operator_relation";
    if (/[_^]/.test(tex)) return "sub_sup";
    return "basic";
  },
  run = async () => {
    const workspace_dir = join(import.meta.dirname, ".."),
      [katex_raw, mathjax_raw] = await Promise.all([extractKatex(), extractMathjax()]),
      seen_tex = read(workspace_dir),
      categories = {
        basic: { katex: [], mathjax: [] },
        greek: { katex: [], mathjax: [] },
        frac: { katex: [], mathjax: [] },
        sqrt: { katex: [], mathjax: [] },
        func: { katex: [], mathjax: [] },
        operator_relation: { katex: [], mathjax: [] },
        sub_sup: { katex: [], mathjax: [] },
      };

    let katex_valid_count = 0,
      katex_skip = 0,
      mathjax_skip = 0;
    const katex_supported = [];
    for (const tex of katex_raw) {
      if (!isSupported(tex)) continue;
      try {
        const out = renderKatex(tex);
        if (out && !out.includes("<merror")) {
          ++katex_valid_count;
          katex_supported.push(tex);
        }
      } catch {
        // ignore
      }
    }

    const mathjax_supported = [];
    const limit = 50;
    for (let i = 0; i < mathjax_raw.length; i += limit) {
      const chunk = mathjax_raw.slice(i, i + limit);
      await Promise.all(
        chunk.map(async (tex) => {
          if (!isSupported(tex)) return;
          try {
            const out = await renderMathjax(tex);
            if (out && !out.includes("<merror")) {
              mathjax_supported.push(tex);
            }
          } catch {
            // ignore
          }
        }),
      );
    }
    const mathjax_valid_count = mathjax_supported.length;

    console.log(
      "KaTeX: " +
        katex_raw.length +
        " unique raw formulas, " +
        katex_valid_count +
        " valid formulas.",
    );
    console.log(
      "MathJax: " +
        mathjax_raw.length +
        " unique raw formulas, " +
        mathjax_valid_count +
        " valid formulas.",
    );

    katex_supported.forEach((tex) => {
      const n = norm(tex);
      if (!seen_tex.has(n)) {
        seen_tex.add(n);
        categories[classify(tex)].katex.push(tex);
      }
    });

    mathjax_supported.forEach((tex) => {
      const n = norm(tex);
      if (!seen_tex.has(n)) {
        seen_tex.add(n);
        categories[classify(tex)].mathjax.push(tex);
      }
    });

    const case_dir = join(workspace_dir, "test/case");

    for (const [cat_name, data] of Object.entries(categories)) {
      const file_path = join(case_dir, cat_name + ".yml"),
        case_map = new Map();

      if (existsSync(file_path)) {
        try {
          const content = readFileSync(file_path, "utf8"),
            existing_cases = load(content) || [];
          existing_cases.forEach(([k, v]) => case_map.set(k, v));
        } catch {
          // ignore
        }
      }

      let updated = false;

      // 1. Process KaTeX data
      for (const tex of data.katex) {
        const input = "$$" + tex + "$$";
        if (case_map.has(input)) continue;
        let output;
        try {
          output = renderKatex(tex);
        } catch {
          continue; // KaTeX failed to parse, ignore silently
        }
        if (output.includes("<merror")) continue;
        try {
          const our_output = convert(input, compile);
          const our_min = normalize(minify(our_output, { collapseWhitespace: true }));
          const expected_min = normalize(minify(output, { collapseWhitespace: true }));
          if (our_min === expected_min) {
            case_map.set(input, output);
            updated = true;
          } else {
            ++katex_skip;
          }
        } catch {
          ++katex_skip;
        }
      }

      // 2. Process MathJax data
      const mathjax_candidates = [],
        mathjax_promises_subset = [];
      for (const tex of data.mathjax) {
        const input = "$$" + tex + "$$";
        if (case_map.has(input)) continue;
        mathjax_candidates.push({ tex, input });
        mathjax_promises_subset.push(renderMathjax(tex).catch(() => null));
      }

      if (mathjax_promises_subset.length > 0) {
        const outputs = await Promise.all(mathjax_promises_subset);
        outputs.forEach((output, idx) => {
          if (!output || output.includes("<merror")) return; // MathJax failed, ignore silently
          const { input } = mathjax_candidates[idx];
          try {
            const our_output = convert(input, compile);
            const our_min = normalize(minify(our_output, { collapseWhitespace: true }));
            const expected_min = normalize(minify(output, { collapseWhitespace: true }));
            if (our_min === expected_min) {
              case_map.set(input, output);
              updated = true;
            } else {
              ++mathjax_skip;
            }
          } catch {
            ++mathjax_skip;
          }
        });
      }

      if (updated) {
        const updated_cases = Array.from(case_map.entries());
        writeFileSync(file_path, dump(updated_cases), "utf8");
        console.log("Generated " + updated_cases.length + " cases for " + cat_name);
      }
    }
    if (katex_skip) {
      WARN("Skip KaTeX unsupported: " + katex_skip);
    }
    if (mathjax_skip) {
      WARN("Skip MathJax unsupported: " + mathjax_skip);
    }
  };

await run();
