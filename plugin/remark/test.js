#!/usr/bin/env -S bun test
import { test, expect } from "bun:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkHtml from "remark-html";
import mathRemark from "./src/index.js";

const render = async (md) => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(mathRemark)
    .use(remarkHtml, { sanitize: false })
    .process(md);
  return String(file);
};

test("remark math inline", async () => {
  const html = await render("inline $E=mc^2$ formula");
  expect(html).toContain("<math");
  expect(html).toContain("E=mc^2");
  expect(html).not.toContain('display="block"');
});

test("remark math block", async () => {
  const html = await render("$$\nE=mc^2\n$$");
  expect(html).toContain("<math");
  expect(html).toContain("E=mc^2");
  expect(html).toContain('display="block"');
});
