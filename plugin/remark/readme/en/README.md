# @webc.site/math-remark

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
