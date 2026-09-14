[English](#en) | [中文](#zh)

---

<a id="en"></a>

# @webc.site/math-remark

- [@webc.site/math-remark](#webcsitemath-remark)
  - [Installation](#installation)
  - [Usage](#usage)

Remark plugin for `@webc.site/math`. Renders Markdown math formulas (LaTeX / TeX) directly to MathML at compile time, featuring extremely small size and fast speed.

## Installation

```bash
npm install @webc.site/math-remark
```

## Usage

```javascript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import mathRemark from "@webc.site/math-remark";
import remarkHtml from "remark-html";

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(mathRemark)
  .use(remarkHtml, { sanitize: false });

const html = await processor.process(
  "Inline math: $E = mc^2$ and block math: \n$$\n\\frac{a}{b}\n$$",
);
console.log(String(html));
```

---

<a id="zh"></a>

# @webc.site/math-remark

- [@webc.site/math-remark](#webcsitemath-remark)
  - [安装](#安装)
  - [使用方法](#使用方法)

`@webc.site/math` 的 Remark 扩展插件。在编译时直接将 Markdown 数学公式 (LaTeX / TeX) 渲染为 MathML，具有极小的体积和极快的运行速度。

## 安装

```bash
npm install @webc.site/math-remark
```

## 使用方法

```javascript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import mathRemark from "@webc.site/math-remark";
import remarkHtml from "remark-html";

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(mathRemark)
  .use(remarkHtml, { sanitize: false });

const html = await processor.process("行内公式: $E = mc^2$ 和 块级公式: \n$$\n\\frac{a}{b}\n$$");
console.log(String(html));
```
