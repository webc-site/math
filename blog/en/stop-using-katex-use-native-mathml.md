# Stop Using KaTeX/MathJax: Render Math in 3.5KB with Native MathML

<table><tr><td><a href="https://www.npmjs.com/package/@webc.site/math" target="_blank"><img src="https://raw.githubusercontent.com/webc-site/math/dev/readme/en/svg/badge.npm.svg" alt="npm" height="60" /></a></td><td><a href="https://github.com/webc-site/math" target="_blank"><img src="https://raw.githubusercontent.com/webc-site/math/dev/readme/en/svg/badge.github.svg" alt="github" height="60" /></a></td><td><a href="https://math.webc.site" target="_blank"><img src="https://raw.githubusercontent.com/webc-site/math/dev/readme/en/svg/badge.demo.svg" alt="demo" height="60" /></a></td></tr></table>

For technical blogs, documentation sites, or any web application supporting Markdown, math formula rendering has always been a heavy burden.

Traditionally, we are forced to choose between **KaTeX** or **MathJax**. However, the cost of using them is massive:

- **Huge Bundle Size**: KaTeX is **75 KB** (minified + gzipped) JS plus hundreds of KB of CSS. MathJax is even larger, taking up to **278 KB** of gzipped JS.
- **Main-Thread Blocking**: They act not only as compilers but also as layout engines written in JavaScript. They compute alignments and spacing, generating thousands of absolute-positioned DOM nodes or SVG elements. This heavily consumes CPU cycles and causes laggy page scrolls, especially on mobile devices.

Are we taking a detour for no reason?

Actually, since **January 2023** (Chrome 109), all major layout engines (Chromium/Blink, Gecko/Firefox, WebKit/Safari) have fully supported **MathML Core** natively. This means: **We no longer need heavy JS layout engines in the frontend. Formula layout can be delegated to the browser's C++ rendering engine!**

With this philosophy, I built an ultra-lightweight TeX-to-MathML compiler: `@webc.site/math`.

- **GitHub Repository**: [webc-site/math](https://github.com/webc-site/math)
- **Live Demo**: [math.webc.site](https://math.webc.site)

---

## Core Advantages: Size & Speed

Since the browser renders MathML natively, all the frontend JavaScript needs to do is **translate TeX syntax (like `e^{i\pi} + 1 = 0`) into MathML Core markup (like `<math>...</math>`)**.

By avoiding frontend layout calculations, we keep the codebase incredibly small:

### 1. Bundle Size Comparison (Gzipped)

- **@webc.site/math (this library)**: **3.58 KB** (7.78 KB raw)
- **KaTeX**: **75.15 KB** (~**21x** larger)
- **MathJax**: **278.39 KB** (~**77.7x** larger)

![Size Comparison](https://raw.githubusercontent.com/webc-site/math/dev/demo/size.svg)

You can easily bundle it into single-page apps (SPAs) or run it during SSR/SSG without adding any significant page load overhead.

### 2. Generation Speed (Ops/sec)

By avoiding time-consuming layout calculations, its generation speed is incredibly fast (based on a classic formula cyclic compilation test):

- **@webc.site/math (this library)**: **~329,000 ops/s**
- **KaTeX**: **~92,000 ops/s** (~3.6x slower)
- **MathJax**: **~6,700 ops/s** (~48.8x slower)

![Speed Comparison](https://raw.githubusercontent.com/webc-site/math/dev/demo/speed.svg)

### 3. The Perfect Companion for LLM/AI Real-Time Formula Rendering

With the rise of AI chatbots (LLM Chat), models stream technical math formulas to the frontend. In these high-frequency redraw scenarios, traditional layout libraries like MathJax or KaTeX cause noticeable rendering lag, high CPU load, and device heating.
Our library's exceptionally low CPU overhead ensures that the typewriter output effect of math formulas remains butter-smooth, even on low-spec mobile devices.

---

## Architecture: How is it so small?

`@webc.site/math` has a highly focused compilation pipeline:

```
TeX Input ──> Lexer ──> Parser ──> Renderer ──> MathML Output
```

1. **Scanner**: Isolates formula delimiters (`$` and `$$`) in Markdown.
2. **Lexer**: Tokenizes characters into numbers, variables, and LaTeX commands.
3. **Parser**: Translates tokens into a flat Abstract Syntax Tree (AST).
4. **Renderer**: Formats the AST nodes into standard XML tags like `<mi>` (identifier), `<mo>` (operator), `<mn>` (number), `<mfrac>` (fraction), etc.

Because spacing and layout calculations are delegated to the browser's C++ rendering engine, we don't need to ship fonts or absolute-positioning CSS logic, reducing the package footprint.

### Robust Error Handling

When users or AI bots enter invalid TeX syntax, we don't want the frontend application to crash.

- When parsing Markdown with `@webc.site/math/md.js`, it automatically catches syntax errors (such as an unclosed `\left`) and **gracefully falls back to displaying the raw TeX code**, eliminating the need for boilerplate `try...catch` blocks.

---

## Formula Rendering Gallery

Here is the typesetting result of the math formulas parsed by this library and rendered natively by browsers using the Latin Modern Math font (exported as SVG vectors):

- **Euler's Identity**
  ![Euler's Identity](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/euler.svg)

- **Quadratic Formula**
  ![Quadratic Formula](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/quadratic.svg)

- **Maxwell's Equation**
  ![Maxwell's Equation](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/maxwell.svg)

- **Schrödinger Equation**
  ![Schrödinger Equation](https://raw.githubusercontent.com/webc-site/math/dev/blog/svg/schrodinger.svg)

---

## Quick Start

### 1. Parsing Math inside Markdown

Use `@webc.site/math/md.js` to parse inline/block math formulas inside Markdown:

```javascript
import mdMath from "@webc.site/math/md.js";

const markdown = "Euler's identity: $$e^{i\\pi} + 1 = 0$$";
const html = mdMath(markdown);
```

### 2. Converting a Single TeX Formula

```javascript
import mathml from "@webc.site/math";
const html = mathml("e^{i\\pi} + 1 = 0", true); // Second argument `true` sets display="block"
```

### 3. Math Font Configuration (Crucial)

While browsers support MathML, adding a specialized OpenType math font will dramatically improve typesetting quality. We recommend referencing **Latin Modern Math** (based on Donald Knuth’s Computer Modern):

```css
/* Import online math font */
@import url("//registry.npmmirror.com/18s/0.2.24/files/m.css");

math {
  font-family: m, math, sans-serif;
}
```

---

## What it is NOT

There are no silver bullets in open source. To keep the size at 3.5KB, we made deliberate trade-offs. This library does **not** support:

1. **Chemical extensions**: such as `\ce{...}` (mhchem).
2. **Macros**: such as `\newcommand` or `\renewcommand`.
3. **Niche LaTeX formatting tweaks**.

For personal blogs, technical documentation, and AI chat rendering (covering 95% of common math use cases), `@webc.site/math` is a dropped-in replacement that offers massive performance gains.

## Conclusion

The year 2023 was a turning point for web math rendering. With native MathML supported everywhere, it's time to stop penalizing users with huge JS layout packages.

Feel free to try it out, leave feedback, or star the project on GitHub:

- **GitHub Repository**: [https://github.com/webc-site/math](https://github.com/webc-site/math)
