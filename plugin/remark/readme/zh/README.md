# @webc.site/math-remark

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
