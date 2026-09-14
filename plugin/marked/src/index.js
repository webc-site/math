import compile from "@webc.site/math";

const INLINE_RE = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n$]))\1/,
  BLOCK_RE = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/,
  tokenize = (src, re, type) => {
    const match = src.match(re);
    if (match) {
      const [raw, marker, text] = match;
      return {
        type,
        raw,
        text: text.trim(),
        display: marker.length === 2,
      };
    }
  },
  inline_math = {
    name: "inlineMath",
    level: "inline",
    start: (src) => src.indexOf("$"),
    tokenizer: (src) => tokenize(src, INLINE_RE, "inlineMath"),
    renderer: (token) => compile(token.text, token.display),
  },
  block_math = {
    name: "blockMath",
    level: "block",
    tokenizer: (src) => tokenize(src, BLOCK_RE, "blockMath"),
    renderer: (token) => compile(token.text, token.display) + "\n",
  };

export default () => ({
  extensions: [block_math, inline_math],
});
