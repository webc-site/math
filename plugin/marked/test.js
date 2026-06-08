#!/usr/bin/env -S bun test
import { test, expect } from "bun:test";
import { marked } from "marked";
import markedMath from "./src/index.js";

marked.use(markedMath());

test("marked math inline", () => {
  const html = marked.parse("inline $E=mc^2$ formula");
  expect(html).toContain("<math");
  expect(html).toContain("E=mc^2");
  expect(html).not.toContain('display="block"');
});

test("marked math block", () => {
  const html = marked.parse("$$\nE=mc^2\n$$");
  expect(html).toContain("<math");
  expect(html).toContain("E=mc^2");
  expect(html).toContain('display="block"');
});
