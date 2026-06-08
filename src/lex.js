import {
  TOK_EOF,
  TOK_NUM,
  TOK_IDENT,
  TOK_OP,
  TOK_CMD,
  TOK_SUB,
  TOK_SUP,
  TOK_LBRACE,
  TOK_RBRACE,
  TOK_LPAREN,
  TOK_RPAREN,
} from "./const/TOK.js";

const CHAR_DOT = 46,
  CHAR_TOK = {
    _: TOK_SUB,
    "^": TOK_SUP,
    "{": TOK_LBRACE,
    "}": TOK_RBRACE,
    "(": TOK_LPAREN,
    ")": TOK_RPAREN,
  },
  isDigit = (c) => c > 47 && c < 58,
  isAlpha = (c) => ((c | 32) - 97) >>> 0 < 26,
  skip = (str, idx) => {
    while (str.charCodeAt(idx) <= 32) ++idx;
    return idx;
  };

export default (str) => {
  const res = [],
    len = str.length;
  let idx = 0;
  while (idx < len) {
    idx = skip(str, idx);
    if (idx >= len) break;

    const code = str.charCodeAt(idx);
    if (code === 92) {
      const start = idx++;
      if (idx < len) {
        if (isAlpha(str.charCodeAt(idx))) {
          while (isAlpha(str.charCodeAt(++idx)));
        } else {
          ++idx;
        }
      }
      const cmd = str.slice(start, idx);
      if (cmd === "\\text") {
        const pos = skip(str, idx);
        if (str.charCodeAt(pos) === 123) {
          let braces = 1,
            t_start = pos + 1,
            t_idx = t_start;
          while (t_idx < len) {
            const cc = str.charCodeAt(t_idx);
            if (cc === 123) ++braces;
            else if (cc === 125 && !--braces) break;
            ++t_idx;
          }
          if (!braces) {
            res.push(
              TOK_CMD,
              "\\text",
              TOK_LBRACE,
              "{",
              TOK_IDENT,
              str.slice(t_start, t_idx),
              TOK_RBRACE,
              "}",
            );
            idx = t_idx + 1;
            continue;
          }
        }
      }
      res.push(TOK_CMD, cmd);
      continue;
    }
    if (isDigit(code) || (code === CHAR_DOT && isDigit(str.charCodeAt(idx + 1)))) {
      const start = idx;
      if (code === CHAR_DOT) {
        idx += 2;
      } else {
        while (isDigit(str.charCodeAt(++idx)));
        if (str.charCodeAt(idx) === CHAR_DOT && isDigit(str.charCodeAt(idx + 1))) {
          idx += 2;
        }
      }
      while (isDigit(str.charCodeAt(idx))) ++idx;
      res.push(TOK_NUM, str.slice(start, idx));
      continue;
    }
    if (isAlpha(code)) {
      res.push(TOK_IDENT, str[idx]);
      ++idx;
      continue;
    }
    const char = str[idx];
    res.push(CHAR_TOK[char] ?? TOK_OP, char);
    ++idx;
  }
  res.push(TOK_EOF, "");
  return res;
};
