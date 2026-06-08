# 3.5KB 搞定公式渲染！是时候放弃 KaTeX / MathJax，拥抱原生 MathML 了

<p>
<a href="https://www.npmjs.com/package/@webc.site/math" target="_blank" style="margin-right: 16px;"><img src="https://raw.githubusercontent.com/webc-site/math/dev/readme/zh/svg/badge.npm.svg" alt="npm" height="60"></a>
<a href="https://github.com/webc-site/math" target="_blank" style="margin-right: 16px;"><img src="https://raw.githubusercontent.com/webc-site/math/dev/readme/zh/svg/badge.github.svg" alt="github" height="60"></a>
<a href="https://math.webc.site" target="_blank"><img src="https://raw.githubusercontent.com/webc-site/math/dev/readme/zh/svg/badge.demo.svg" alt="demo" height="60"></a>
</p>

在开发技术博客、文档系统或支持 Markdown 的网页应用时，数学公式渲染一直是一块难以卸下的“巨石”。

为了让公式能够漂亮地排版，我们通常别无选择地引入 **KaTeX** 甚至 **MathJax**。然而，这些库带来的代价极其沉重：

- **包体积膨胀**：KaTeX 压缩后需要 **75 KB** 的 JS + 几百 KB 的 CSS；而 MathJax 压缩后更是高达 **278 KB** 的 JS，简直是前端性能的“首屏杀手”。
- **主线程卡顿**：它们在前端不仅仅是“编译器”，更是一整套庞大的“排版引擎”。它们通过复杂的 JS 计算，生成成百上千个由绝对定位、行内样式拼接而成的 HTML/SVG 节点来模拟公式排版。这会消耗大量的客户端 CPU 算力，尤其在移动端，会造成明显的白屏和滚动卡顿。

我们是否一直在“走弯路”？

其实，自 **2023 年 1 月** 起，随着 Chrome 109 正式支持 **MathML Core** 标准，所有主流浏览器（Chromium/Blink、Gecko/Firefox、WebKit/Safari）都已经原生地支持了 MathML 标签。这意味着：**我们不再需要在前端加载复杂的排版引擎，公式排版完全可以交给浏览器的底层 C++ 引擎去高效完成！**

为了践行这一理念，我写了一个超轻量的 TeX-to-MathML 编译器：`@webc.site/math`。

- **GitHub 仓库**：[webc-site/math](https://github.com/webc-site/math)
- **在线 Demo**：[math.webc.site](https://math.webc.site)

---

## 核心优势：极致的轻量与速度

既然浏览器可以直接渲染 MathML，那么前端 JS 唯一需要做的，就是**把 TeX 语法（如 `e^{i\pi} + 1 = 0`）翻译成 MathML 标签（如 `<math>...</math>`）**。

因为摆脱了前端排版计算，编译器的代码量可以精简到极致：

### 1. 包体积对比 (Gzip 压缩后)

- **@webc.site/math (本库)**: **3.58 KB** (原始大小 7.78 KB)
- **KaTeX**: **75.15 KB** (约本库的 **21.0 倍**)
- **MathJax**: **278.39 KB** (约本库的 **77.7 倍**)

![体积对比](https://raw.githubusercontent.com/webc-site/math/dev/demo/size.svg)

你可以毫无负担地把它打包进任何单页应用（SPA）中，甚至在 SSR/SSG 构建阶段生成，首屏加载速度近乎零损耗。

### 2. 生成速度对比 (Ops/sec)

由于避开了耗时的排版计算，它的生成速度达到了恐怖的级别（基于经典公式循环编译测试）：

- **@webc.site/math (本库)**: **~329,000 ops/s**
- **KaTeX**: **~92,000 ops/s** (约 3.6x 较慢)
- **MathJax**: **~6,700 ops/s** (约 48.8x 较慢)

![性能对比](https://raw.githubusercontent.com/webc-site/math/dev/demo/speed.svg)

### 3. LLM/AI 时代前端实时公式渲染的黄金搭档

在当前的 AI 智能对话（LLM Chat）场景中，大模型会通过 Server-Sent Events (SSE) 以前端流式输出（Streaming）的方式吐出大量的公式文本。在这种高频重绘场景下，传统的 MathJax/KaTeX 会造成显著的重绘延迟、发热和耗电。

- 而本库极低的 CPU 消耗，保证了即使在低端移动设备上，AI 输出公式时的打字机效果依然丝滑顺畅。

---

## 设计思路：如何用 3KB 搞定这一切？

`@webc.site/math` 的极小体积 and 高性能，得益于其高度聚焦的设计。它仅包含四个核心部分：

```
输入 TeX ──> 词法分析 (Lexer) ──> 语法分析 (Parser) ──> 渲染器 (Renderer) ──> MathML 输出
```

1. **扫描器**：定位 Markdown 中的 `$` 和 `$$` 定界符。
2. **Lexer**：高效切割 Token，只做基础的语法 and 符号分类。
3. **Parser**：将 Token 转为一颗扁平的抽象语法树（AST）节点。
4. **Renderer**：根据 AST 生成符合 MathML Core 规范的 XML 标签，如 `<mi>`（变量）、`<mo>`（运算符）、`<mn>`（数字）、`<mfrac>`（分式）等。

因为排版完全交给了浏览器，我们省去了所有位置计算、多语言字体打包 and DOM 拼接代码，从而用极少的代码实现了全套的核心逻辑。

### 强大的健壮性与容错

在前端，如果用户或 AI 输入了错误的 TeX 语法（例如没有闭合的 `\left(`），我们绝不希望页面因此崩溃。

- 在解析 Markdown 时，`@webc.site/math/md.js` 内部自动捕获编译阶段的语法错误，并**优雅退化为显示原始文本**，免去了手动写 `try...catch` 的繁琐。

---

## 真实公式渲染排版效果展示

以下为浏览器使用 Latin Modern Math 字体原生渲染 TeX 公式转换后的 MathML 真实效果展示（导出为 SVG 矢量图）：

- **欧拉恒等式 (Euler's Identity)**
  ![欧拉恒等式](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/euler.svg)

- **二次方程求解公式 (Quadratic Formula)**
  ![二次方程求解公式](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/quadratic.svg)

- **麦克斯韦方程之一 (Maxwell's Equation)**
  ![麦克斯韦方程之一](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/maxwell.svg)

- **薛定谔方程 (Schrödinger Equation)**
  ![薛定谔方程](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/schrodinger.svg)

---

## 快速上手

你可以非常方便地在项目中使用它。

### 1. 替换 Markdown 文本中的公式

可以使用 `@webc.site/math/md.js`，它会自动提取 Markdown 中的公式并直接转换成原生 MathML。

```javascript
import mdMath from "@webc.site/math/md.js";

const markdown = "欧拉恒等式：$$e^{i\\pi} + 1 = 0$$";
const html = mdMath(markdown);
```

### 2. 直接转换单个 TeX 公式

```javascript
import mathml from "@webc.site/math";
const html = mathml("e^{i\\pi} + 1 = 0", true); // 第二个参数传入 true 表示渲染为块级公式
```

### 3. 配置优雅的数学字体（关键）

虽然现代浏览器能直接渲染 MathML，但为了获得像排版印刷品一样的精美效果，强烈建议配合专门 of 数学字体使用。我们推荐引用 `Latin Modern Math` 字体（源自高德纳经典的 Computer Modern）：

```css
/* 引入在线数学字体 */
@import url("//registry.npmmirror.com/18s/0.2.24/files/m.css");

math {
  /* m 为数学字体，math 为系统数学字体，sans-serif 为默认无衬线字体 */
  font-family: m, math, sans-serif;
}
```

---

## 它不适合什么？

开源项目没有银弹，为了保持 3.5KB 的体积，我们在功能边界上做了一些取舍。本库**不支持**：

1. **化学公式扩展**：如 `\ce{...}` 等高级宏。
2. **复杂的宏定义**：如 `\newcommand`、`\renewcommand`。
3. **极少数冷门 LaTeX 样式微调指令**。

对于个人博客、常规技术文档、AI 对话公式渲染等 95% 的日常场景，`@webc.site/math` 的功能已经完全足够，且能为你的用户带来极致的加载体验。

## 总结

2023 年是网页公式渲染的分水岭，随着浏览器对原生 MathML 支持的普及，我们不再需要被庞大的第三方排版库拖慢网速。

欢迎前往 GitHub 试用、反馈和交流：

- **GitHub 仓库**：[https://github.com/webc-site/math](https://github.com/webc-site/math)
