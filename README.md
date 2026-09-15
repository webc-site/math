[English](#en) | [中文](#zh)

---

<a id="en"></a>

# @webc.site/math : The world's smallest and fastest web Markdown formula renderer

- [1. Features](#1-features)
- [2. Usage](#2-usage)
  - [Compilation Examples](#compilation-examples)
    - [Render TeX Formulas Directly](#render-tex-formulas-directly)
    - [Replace Formulas in Markdown Text](#replace-formulas-in-markdown-text)
  - [Font and CSS Configuration](#font-and-css-configuration)
    - [Importing the Math Font](#importing-the-math-font)
      - [Option 1: Via CDN (Recommended)](#option-1-via-cdn-recommended)
      - [Option 2: Self-hosting Font Files](#option-2-self-hosting-font-files)
    - [CSS Styling Configuration](#css-styling-configuration)
      - [Font Family Fallback Chain](#font-family-fallback-chain)
      - [Block Formula Layout Optimization](#block-formula-layout-optimization)
- [3. Plugins](#3-plugins)
  - [3.1 markdown-it](#31-markdown-it)
  - [3.2 marked](#32-marked)
  - [3.3 remark](#33-remark)
- [4. Design](#4-design)
- [5. Tech Stack](#5-tech-stack)
- [6. Code Structure](#6-code-structure)
- [7. Historical Background](#7-historical-background)

## 1. Features

This project compiles LaTeX math formulas into browser-native MathML Core markup. Through compile-time conversion, it bypasses client-side layout engines to achieve zero-overhead formula rendering.

Key Features:

- **High Performance**: Compiles TeX formulas directly to native MathML. Processing speed exceeds 300,000 operations per second, 3 times faster than KaTeX and 40 times faster than MathJax.
- **Lightweight**: Core package size is 9.13 KB (4.62 KB gzipped) with zero external dependencies.
- **Zero Runtime Overhead**: Relies entirely on the browser's native engine for layout, eliminating client-side JavaScript formatting libraries.
- **Robust Fault Tolerance**: Catches syntax errors (such as unclosed braces) and reverts to raw TeX string output to prevent application crashes.
- **High Compatibility**: Generates standard MathML tags suitable for Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR).

## 2. Usage

### Compilation Examples

#### Render TeX Formulas Directly

```javascript
import mathml from "@webc.site/math";

// Second parameter set to true renders block style
const html = mathml("e^{i\\pi} + 1 = 0", true);
```

#### Replace Formulas in Markdown Text

```javascript
import mdMath from "@webc.site/math/md.js";
import compile from "@webc.site/math";

const html = mdMath("Euler's identity: $$e^{i\\pi} + 1 = 0$$", compile);
```

### Font and CSS Configuration

MathML layout relies on OpenType Math fonts containing dedicated mathematical metrics (the `MATH` table) to correctly handle radical scaling, delimiter stretching (e.g., parentheses, braces), fraction line thickness, and sub/superscript alignments.

The classic TeX math font **Latin Modern Math** (derived from Donald Knuth's Computer Modern family) is recommended.

#### Importing the Math Font

##### Option 1: Via CDN (Recommended)

Import the Latin Modern Math font stylesheet from the `18s` font package (which registers the font family name as `m`):

In CSS:

```css
@import url("https://registry.npmmirror.com/18s/0.2.24/files/m.css");
```

Or in HTML `<head>`:

```html
<link rel="stylesheet" href="https://registry.npmmirror.com/18s/0.2.24/files/m.css" />
```

To include the body text font (`t`) and monospace code font (`c`) along with the math font, import the complete stylesheet:

```html
<link rel="stylesheet" href="https://registry.npmmirror.com/18s/0.2.24/files/_.css" />
```

##### Option 2: Self-hosting Font Files

Download the Latin Modern Math WOFF2 font file and declare `@font-face`:

```css
@font-face {
  font-family: "Latin Modern Math";
  src: url("/fonts/latinmodern-math.woff2") format("woff2");
  font-style: normal;
  font-display: swap;
}
```

#### CSS Styling Configuration

##### Font Family Fallback Chain

Declare the font stack and inherit text color for `<math>` elements:

```css
math {
  font-family: m, "Latin Modern Math", "Cambria Math", math, sans-serif;
  color: inherit;
}
```

- `m`: Latin Modern Math declared via `m.css`
- `"Latin Modern Math"`: Self-hosted or system-installed Latin Modern Math
- `"Cambria Math"`: Built-in Windows system math font
- `math`: W3C CSS Fonts generic math font family keyword (natively supported in modern browsers)
- `sans-serif`: Final sans-serif fallback

##### Block Formula Layout Optimization

Compiled block formulas contain the `display="block"` attribute. To prevent wide formulas from overflowing containers on mobile or narrow screens, configure horizontal scrolling and centering:

```css
math[display="block"] {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  margin: 1em auto;
  padding: 0.5em 0;
  text-align: center;
}
```

## 3. Plugins

This project provides extension plugins for mainstream Markdown parsers to render TeX formulas directly to MathML markup during compilation/building.

### 3.1 markdown-it

Installation:

```bash
npm install @webc.site/math-markdown-it
```

Usage:

```javascript
import markdownit from "markdown-it";
import mathMarkdownIt from "@webc.site/math-markdown-it";

const md = markdownit().use(mathMarkdownIt);

const html = md.render("Inline math: $E = mc^2$ and block math: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```

### 3.2 marked

Installation:

```bash
npm install @webc.site/math-marked
```

Usage:

```javascript
import { marked } from "marked";
import mathMarked from "@webc.site/math-marked";

marked.use(mathMarked());

const html = marked.parse("Inline math: $E = mc^2$ and block math: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```

### 3.3 remark

Installation:

```bash
npm install @webc.site/math-remark
```

Usage:

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

## 4. Design

The compiler extracts TeX formulas from input Markdown text, tokenizes and parses them, and translates the AST to semantic MathML markup.

```mermaid
graph TD
    Input[Input Markdown] --> Scanner[Scanner: Locates Delimiters]
    Scanner -->|Plain Text| Buffer[Output Buffer]
    Scanner -->|TeX Formula| Lexer[Lexer: Tokenizes Input]
    Lexer --> Parser[Parser: Builds AST]
    Parser --> Codegen[Codegen: Translates to MathML Tags]
    Codegen --> Wrapper[Semantic Wrapper]
    Wrapper --> MathML[MathML Output]
    Buffer --> Output[Final HTML]
    MathML --> Output
```

## 5. Tech Stack

- **Build & Test Environment**: Bun, Node.js
- **Linter & Formatter**: oxlint, oxfmt
- **Build Tool**: Vite, Rolldown, Lightning CSS

## 6. Code Structure

```
.
├── demo/                # Interactive demo page
├── extract/             # Test cases extraction scripts
├── lib/                 # Compiled distribution files
│   ├── mathml.js        # Core compiler (minified)
│   └── md.js            # Markdown math formula parser (minified)
├── src/                 # Source code
│   ├── const/           # Tokens, AST types, symbols, and functions constants
│   ├── lex.js           # LaTeX lexer
│   ├── parse.js         # LaTeX parser (AST builder)
│   ├── mathml.js        # Core TeX-to-MathML compiler
│   └── md.js            # Markdown parser entry
├── sh/                  # Scripts
└── test.sh              # Quality verification and test runner
```

## 7. Historical Background

The W3C published the MathML 1.0 specification in 1998 to standardize mathematical notation on the web. However, the complexity of the specification placed a maintenance burden on browser layout engines.

In 2013, the Chromium team removed the unfinished MathML rendering implementation from the Blink engine due to maintenance costs and security vulnerabilities. Web developers subsequently relied on client-side JavaScript libraries (such as MathJax and KaTeX) to simulate formula layout. These libraries increased bundle sizes and consumed client-side CPU resources, impacting page load times and rendering performance.

To resolve this issue, organizations like Igalia and Mozilla refactored the specification into the MathML Core standard, focusing on essential, implementable parts backed by Web Platform Tests.

In January 2023, Chrome 109 reintroduced support for the MathML Core specification. With Blink, Gecko, and WebKit all natively supporting this subset, web browsers achieved consistent native MathML rendering. This project compiles TeX directly to native MathML markup at compile time, eliminating client-side layout engines and avoiding client-side rendering overhead.

---

<a id="zh"></a>

# @webc.site/math : 全球最小最快的网页 Markdown 公式渲染器

- [1. 功能介绍](#1-功能介绍)
- [2. 使用演示](#2-使用演示)
  - [直接渲染 TeX 公式](#直接渲染-tex-公式)
  - [替换 Markdown 文本中的公式](#替换-markdown-文本中的公式)
  - [字体与 CSS 配置](#字体与-css-配置)
    - [引入数学字体](#引入数学字体)
      - [方式一：CDN 在线引用（推荐）](#方式一cdn-在线引用推荐)
      - [方式二：本地托管字体文件](#方式二本地托管字体文件)
    - [CSS 样式配置](#css-样式配置)
      - [字体族声明与回退链](#字体族声明与回退链)
      - [块级公式排版优化](#块级公式排版优化)
- [3. 插件](#3-插件)
  - [3.1 markdown-it](#31-markdown-it)
  - [3.2 marked](#32-marked)
  - [3.3 remark](#33-remark)
- [4. 设计思路](#4-设计思路)
- [5. 技术栈](#5-技术栈)
- [6. 代码结构](#6-代码结构)
- [7. 历史故事](#7-历史故事)

## 1. 功能介绍

本项目将 LaTeX 数学公式编译为浏览器原生支持的 MathML Core 标记。通过编译期转换，无需客户端排版引擎，实现零运行时开销的公式渲染。

核心特性：

- **高性能**：TeX 公式直接转换为原生 MathML 标签，处理速度达每秒 300,000 次以上
- **轻量化**：核心包体积 9.13 KB（Gzip 压缩后 4.62 KB），无外部依赖
- **零运行开销**：完全依赖浏览器原生引擎排版与渲染
- **高容错性**：自动捕获语法错误，降级输出原始 TeX 字符串
- **强兼容性**：生成标准 MathML 标签，适配 SSR、SSG 和 CSR

## 2. 使用演示

### 直接渲染 TeX 公式

```javascript
import mathml from "@webc.site/math";

// 第二参数为 true 表示渲染为块级公式
const html = mathml("e^{i\\pi} + 1 = 0", true);
```

### 替换 Markdown 文本中的公式

```javascript
import mdMath from "@webc.site/math/md.js";
import compile from "@webc.site/math";

const html = mdMath("欧拉恒等式：$$e^{i\\pi} + 1 = 0$$", compile);
```

### 字体与 CSS 配置

浏览器排版 MathML 依赖包含数学排版度量（OpenType Math 表）的数学字体，用于呈现根号伸缩、大括号拉伸、分式厚度与上下标对齐。

推荐使用 TeX 经典数学字体 **Latin Modern Math**（源自 Computer Modern 字体家族）。

#### 引入数学字体

##### 方式一：CDN 在线引用（推荐）

通过 `18s` 字体包在线引入 Latin Modern Math 样式（该样式将 Latin Modern Math 声明为字体族 `m`）：

在 CSS 中引入：

```css
@import url("https://registry.npmmirror.com/18s/0.2.24/files/m.css");
```

或在 HTML `<head>` 中引入：

```html
<link rel="stylesheet" href="https://registry.npmmirror.com/18s/0.2.24/files/m.css" />
```

若同时需要页面正文字体（`t`）与代码等宽字体（`c`），可直接引用完整样式表：

```html
<link rel="stylesheet" href="https://registry.npmmirror.com/18s/0.2.24/files/_.css" />
```

##### 方式二：本地托管字体文件

下载 Latin Modern Math 字体文件（WOFF2 格式），通过 `@font-face` 声明：

```css
@font-face {
  font-family: "Latin Modern Math";
  src: url("/fonts/latinmodern-math.woff2") format("woff2");
  font-style: normal;
  font-display: swap;
}
```

#### CSS 样式配置

##### 字体族声明与回退链

为 `<math>` 标签配置字体族与继承颜色：

```css
math {
  font-family: m, "Latin Modern Math", "Cambria Math", math, sans-serif;
  color: inherit;
}
```

- `m`：`m.css` 声明的 Latin Modern Math 网页字体
- `"Latin Modern Math"`：本地托管或系统安装的 Latin Modern Math 字体
- `"Cambria Math"`：Windows 系统内置数学字体
- `math`：CSS Fonts 规范定义的数学通用字体族关键字（现代主流浏览器原生支持）
- `sans-serif`：无衬线回退字体

##### 块级公式排版优化

块级公式编译后带有 `display="block"` 属性。为防止长公式超出容器或在移动端撑破页面，推荐配置横向滚动与居中样式：

```css
math[display="block"] {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  margin: 1em auto;
  padding: 0.5em 0;
  text-align: center;
}
```

## 3. 插件

本项目为各大主流 Markdown 解析器提供了扩展插件，可在编译/构建时直接将 TeX 公式渲染为原生 MathML 标记。

### 3.1 markdown-it

安装：

```bash
npm install @webc.site/math-markdown-it
```

使用方法：

```javascript
import markdownit from "markdown-it";
import mathMarkdownIt from "@webc.site/math-markdown-it";

const md = markdownit().use(mathMarkdownIt);

const html = md.render("行内公式: $E = mc^2$ 和 块级公式: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```

### 3.2 marked

安装：

```bash
npm install @webc.site/math-marked
```

使用方法：

```javascript
import { marked } from "marked";
import mathMarked from "@webc.site/math-marked";

marked.use(mathMarked());

const html = marked.parse("行内公式: $E = mc^2$ 和 块级公式: \n$$\n\\frac{a}{b}\n$$");
console.log(html);
```

### 3.3 remark

安装：

```bash
npm install @webc.site/math-remark
```

使用方法：

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

## 4. 设计思路

编译器从输入文本中提取 TeX 公式，依次通过扫描、词法分析、语法分析，最终生成语义化 MathML 标记。

```mermaid
graph TD
    Input[输入文本] --> Scanner[扫描器: 定界符定位]
    Scanner -->|普通文本| Buffer[输出缓冲区]
    Scanner -->|TeX 公式| Lexer[词法分析: 生成 Token]
    Lexer --> Parser[语法分析: 生成 AST]
    Parser --> Codegen[代码生成: 映射 MathML 标签]
    Codegen --> Wrapper[语义包装]
    Wrapper --> MathML[MathML 输出]
    Buffer --> Output[最终 HTML]
    MathML --> Output
```

## 5. 技术栈

- **运行环境**：Node.js, Bun
- **构建工具**：Rolldown, Vite
- **样式处理**：Lightning CSS
- **代码质量**：oxlint, oxfmt

## 6. 代码结构

```
.
├── lib/                 # 编译产物目录
│   ├── mathml.js        # 核心编译器
│   └── md.js            # Markdown 公式解析器
├── src/                 # 源代码
│   ├── const/           # Token、AST 节点、符号和函数常量定义
│   ├── lex.js           # LaTeX 词法分析器
│   ├── parse.js         # LaTeX 语法分析器
│   ├── mathml.js        # TeX 至 MathML 核心编译器
│   └── md.js            # Markdown 公式解析入口
├── demo/                # 演示页面
├── extract/             # 测试用例提取脚本
└── sh/                  # 构建脚本
```

## 7. 历史故事

1998 年，W3C 发布 MathML 1.0 规范，旨在提供万维网数学公式的标准排版方案。由于早期规范复杂，给浏览器排版引擎带来维护负担。

2013 年，Chromium 团队因维护成本与安全漏洞考量，移除了 Blink 引擎中的 MathML 渲染代码。网页公式排版转为依赖第三方 JavaScript 库（如 MathJax、KaTeX）模拟公式布局。

2023 年 1 月，Chrome 109 重新支持 MathML Core 标准，Blink、Gecko 和 WebKit 三大主流浏览器引擎实现原生 MathML 渲染支持。本项目在此背景下开发，将 TeX 在构建期或服务端直接编译为原生 MathML 标记。
