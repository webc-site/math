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
