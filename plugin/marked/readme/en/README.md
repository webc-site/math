# @webc.site/math-marked

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
