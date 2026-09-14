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
