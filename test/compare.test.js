#!/usr/bin/env -S bun test
import { expect, test } from "bun:test";
import cases from "./compare.js";
import compile from "../lib/mathml.js";
import convert from "../lib/md.js";

for (const { name, fn } of cases()) {
  test(name, fn);
}

test("issue #5: throw on unsupported command", () => {
  expect(() => compile("\\fooBarUnknown")).toThrow();
});

test("issue #5: fallback to raw TeX in markdown on unsupported command", () => {
  const md = "Formula: $$\\unknownCmd{x}$$ and $\\invalidOp$ end";
  expect(convert(md, compile)).toBe(md);
});

test("issue #5: no command leaking into MathML text nodes", () => {
  const formulas = [
    "\\hat{h}_U[n]",
    "P(w_i \\mid w_{1:i-1})",
    "\\hat{x}",
    "\\tilde{x}",
    "\\mathbf{x}",
    "\\mathrm{abc}",
    "\\textrm{abc}",
    "\\dfrac{a}{b}",
    "\\stackrel{a}{b}",
    "a \\longrightarrow b",
    "\\varphi",
    "\\mathbb{R}",
    "a \\otimes b",
    "a \\oplus b",
    "a \\mid b",
    "a \\ll b",
    "90\\degree",
    "x = 1 \\tag{1}",
    "\\prod_{i=1}^n x_i",
    "\\mathcal{F}",
    "a \\lt b",
    "a \\circ b",
    "a \\bullet b",
    "\\downarrow",
    "\\uparrow",
    "\\iint",
    "\\bm{x}",
    "\\rm{abc}",
    "\\operatorname{diag}(x)",
    "\\overset{a}{b}",
    "\\underset{a}{b}",
  ];
  for (const f of formulas) {
    const res = compile(f, true);
    expect(res).not.toContain("<mi>\\");
  }
});

test("align*: equal-sign alignment and display attributes", () => {
  const f = "\\begin{align*}\na^2+b & = 3c^2\n\\\\\nc & = \\sqrt{\\frac{a^2+b}{3}}\n\\end{align*}",
    res = compile(f, true);
  expect(res).toContain('style="justify-items:end;padding-right:0"');
  expect(res).toContain('style="justify-items:start;padding-left:0"');
  expect(res).toContain('displaystyle="true"');
  expect(res).toContain('rowspacing=".6em"');
  expect(res).toContain('columnalign="right left"');
  expect(res).not.toContain("text-align");
});

test("align*: left alignment with & at line start", () => {
  const f = "\\begin{align*}\n& a^2+b = 3c^2\n\\\\\n& c = \\sqrt{\\frac{a^2+b}{3}}\n\\end{align*}",
    res = compile(f, true);
  expect(res).toContain('<mtd style="justify-items:end;padding-right:0"></mtd>');
  expect(res).toContain('style="justify-items:start;padding-left:0"');
  expect(res).toContain('displaystyle="true"');
  expect(res).toContain('rowspacing=".6em"');
});

test("cases: relation-aware alignment", () => {
  const f_rel = "\\begin{cases} x & = 1 \\\\ y & = 2 \\end{cases}",
    res_rel = compile(f_rel, true);
  expect(res_rel).toContain('style="justify-items:start;padding-right:0"');
  expect(res_rel).toContain('style="justify-items:start;padding-left:0"');
  expect(res_rel).toContain('columnspacing="0"');

  const f_nor = "\\begin{cases} x & \\text{if } a \\\\ y & \\text{if } b \\end{cases}",
    res_nor = compile(f_nor, true);
  expect(res_nor).toContain('style="justify-items:start"');
  expect(res_nor).toContain('columnspacing="1em"');
});

test("matrix: delimiters and compact style", () => {
  const pmat = compile("\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", true);
  expect(pmat).toContain("<mo>(</mo>");
  expect(pmat).toContain("<mo>)</mo>");
  expect(pmat).not.toContain('displaystyle="true"');

  const bmat = compile("\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}", true);
  expect(bmat).toContain("<mo>[</mo>");
  expect(bmat).toContain("<mo>]</mo>");

  const vmat = compile("\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}", true);
  expect(vmat).toContain("<mo>|</mo>");

  const v_mat = compile("\\begin{Vmatrix} a & b \\\\ c & d \\end{Vmatrix}", true);
  expect(v_mat).toContain("<mo>‖</mo>");
});
