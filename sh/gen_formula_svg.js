#!/usr/bin/env bun
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { init } from "mathjax";
import ROOT from "./ROOT.js";

const FORMULAS = {
  euler: "e^{i\\pi} + 1 = 0",
  schrodinger:
    "i\\hbar\\frac{\\partial}{\\partial t}\\Psi(x,t) = \\left[-\\frac{\\hbar^2}{2m}\\frac{\\partial^2}{\\partial x^2} + V(x)\\right]\\Psi(x,t)",
  maxwell: "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
  quadratic: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
};

const main = async () => {
  const MathJax = await init({
    loader: { load: ["input/tex", "output/svg"] },
  });

  const blogSvgDir = join(ROOT, "blog/svg");
  mkdirSync(blogSvgDir, { recursive: true });

  // Generate formula SVGs only
  for (const [name, tex] of Object.entries(FORMULAS)) {
    const node = MathJax.tex2svg(tex);
    const html = MathJax.startup.adaptor.outerHTML(node);

    const match = html.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (match) {
      let svg = match[0];

      const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
      if (viewBoxMatch) {
        const [vx, vy, vw, vh] = viewBoxMatch[1].split(/\s+/).map(Number);
        const paddingY = Math.round(vh * 0.25);
        const newVy = vy - paddingY;
        const newVh = vh + paddingY * 2;

        const ratio = newVh / vh;
        svg = svg.replace(
          /viewBox="[^"]+"/,
          'viewBox="' + vx + " " + newVy + " " + vw + " " + newVh + '"',
        );

        svg = svg.replace(/height="([^"]+)"/, (_, h) => {
          const val = parseFloat(h);
          const unit = h.replace(/[0-9.]/g, "");
          return 'height="' + (val * ratio).toFixed(3) + unit + '"';
        });
        svg = svg.replace(/width="([^"]+)"/, (_, w) => {
          const val = parseFloat(w);
          const unit = w.replace(/[0-9.]/g, "");
          return 'width="' + (val * ratio).toFixed(3) + unit + '"';
        });
      }

      const svgPath = join(blogSvgDir, name + ".svg");
      writeFileSync(svgPath, svg);
      console.log("Generated " + svgPath);
    }
  }
};

main();
