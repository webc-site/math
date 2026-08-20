[English](#en) | [中文](#zh)

---

<a id="en"></a>

# @webc.site/math-marked

- [@webc.site/math-marked](#webcsitemath-marked)
  - [Installation](#installation)
  - [Usage](#usage)

Marked extension for `@webc.site/math`. Renders Markdown math formulas (LaTeX / TeX) directly to MathML at compile time, featuring extremely small size and fast speed.

## Installation

```bash
npm install @webc.site/math-marked
```

## Usage

```javascript
import { marked } from "marked";
import mathMarked from "@webc.site/math-marked";

marked.use(mathMarked());

const html = marked.parse("Inline math: $E = mc^2$ and block math: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```

---

<a id="zh"></a>

# @webc.site/math-marked

- [@webc.site/math-marked](#webcsitemath-marked)
  - [安装](#安装)
  - [使用方法](#使用方法)

`@webc.site/math` 的 Marked 扩展插件。在编译时直接将 Markdown 数学公式 (LaTeX / TeX) 渲染为 MathML，具有极小的体积和极快的运行速度。

## 安装

```bash
npm install @webc.site/math-marked
```

## 使用方法

```javascript
import { marked } from "marked";
import mathMarked from "@webc.site/math-marked";

marked.use(mathMarked());

const html = marked.parse("行内公式: $E = mc^2$ 和 块级公式: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```
