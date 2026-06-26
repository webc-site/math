import {
  TOK_EOF,
  TOK_NUM,
  TOK_IDENT,
  TOK_OP,
  TOK_CMD,
  TOK_SUB,
  TOK_LBRACE,
  TOK_RBRACE,
} from "./const/TOK.js";

const skip = (str, idx) => (str.charCodeAt(idx) <= 32 ? skip(str, idx + 1) : idx),
  NUM_RE = /\d+(?:\.\d+)?|\.\d+/y,
  CMD_RE = /\\(?:[a-zA-Z]+|.)/y;

export default (str) => {
  const res = [],
    len = str.length;
  let idx = 0;
  while (idx < len) {
    idx = skip(str, idx);
    if (idx >= len) break;

    CMD_RE.lastIndex = idx;
    let m = CMD_RE.exec(str);
    if (m) {
      const cmd = m[0];
      idx += cmd.length;
      if (cmd === "\\text") {
        const pos = skip(str, idx);
        if (str.charCodeAt(pos) === 123) {
          let braces = 1,
            t_idx = pos;
          while (t_idx < len && braces) {
            const cc = str.charCodeAt(++t_idx);
            if (cc === 123) ++braces;
            else if (cc === 125) --braces;
          }
          if (!braces) {
            res.push(
              TOK_CMD,
              cmd,
              TOK_LBRACE,
              "{",
              TOK_IDENT,
              str.slice(pos + 1, t_idx),
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

    NUM_RE.lastIndex = idx;
    m = NUM_RE.exec(str);
    if (m) {
      const num = m[0];
      res.push(TOK_NUM, num);
      idx += num.length;
      continue;
    }

    const code = str.charCodeAt(idx);
    if (((code | 32) - 97) >>> 0 < 26) {
      res.push(TOK_IDENT, str[idx]);
      ++idx;
      continue;
    }
    const char = str[idx],
      pos = "_^{}".indexOf(char);
    res.push(pos >= 0 ? pos + TOK_SUB : TOK_OP, char);
    ++idx;
  }
  res.push(TOK_EOF, "");
  return res;
};
