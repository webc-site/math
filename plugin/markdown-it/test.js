#!/usr/bin/env -S bun test
import { test, expect } from "bun:test";
import markdownit from "markdown-it";
import mathMarkdownIt from "./src/index.js";

const md = markdownit().use(mathMarkdownIt);

test("markdown-it math inline", () => {
  const html = md.render("inline $E=mc^2$ formula");
  expect(html).toContain("<math");
  expect(html).toContain("E=mc^2");
  expect(html).not.toContain('display="block"');
});

test("markdown-it math block", () => {
  const html = md.render("$$\nE=mc^2\n$$");
  expect(html).toContain("<math");
  expect(html).toContain("E=mc^2");
  expect(html).toContain('display="block"');
});
