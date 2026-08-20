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
