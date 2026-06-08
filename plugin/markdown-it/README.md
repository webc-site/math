[English](#en) | [中文](#zh)

---

<a id="en"></a>

# @webc.site/math-markdown-it

Markdown-it plugin for `@webc.site/math`. Renders Markdown math formulas (LaTeX / TeX) directly to MathML at compile time, featuring extremely small size and fast speed.

## Installation

```bash
npm install @webc.site/math-markdown-it
```

## Usage

```javascript
import markdownit from "markdown-it";
import mathMarkdownIt from "@webc.site/math-markdown-it";

const md = markdownit().use(mathMarkdownIt);

const html = md.render("Inline math: $E = mc^2$ and block math: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```

---

<a id="zh"></a>

# @webc.site/math-markdown-it

`@webc.site/math` 的 Markdown-it 扩展插件。在编译时直接将 Markdown 数学公式 (LaTeX / TeX) 渲染为 MathML，具有极小的体积和极快的运行速度。

## 安装

```bash
npm install @webc.site/math-markdown-it
```

## 使用方法

```javascript
import markdownit from "markdown-it";
import mathMarkdownIt from "@webc.site/math-markdown-it";

const md = markdownit().use(mathMarkdownIt);

const html = md.render("行内公式: $E = mc^2$ 和 块级公式: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```
