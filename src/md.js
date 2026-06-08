const DOLLAR = "$",
  STATE_TEXT = 0,
  STATE_INLINE_CODE = 1,
  STATE_BLOCK_CODE = 2,
  STATE_INLINE_MATH = 3,
  STATE_BLOCK_MATH = 4,
  REG_MD = /[\$`\\]/g,
  REG_MATH = /[\$\\]/g,
  find = (str, start, is_md) => {
    const reg = is_md ? REG_MD : REG_MATH;
    reg.lastIndex = start;
    return reg.exec(str)?.index ?? -1;
  };

export default (md, compile) => {
  const len = md.length;
  let res = "",
    idx = 0,
    state = STATE_TEXT,
    start = 0;

  while (idx < len) {
    if (state === STATE_TEXT) {
      const pos = find(md, idx, 1);
      if (pos === -1) {
        res += md.slice(idx);
        break;
      }
      res += md.slice(idx, pos);
      const char = md[pos];
      if (char === "\\") {
        const esc = md[pos + 1] === DOLLAR;
        res += esc ? DOLLAR : "\\";
        idx = pos + (esc ? 2 : 1);
      } else if (char === DOLLAR) {
        const block = md[pos + 1] === DOLLAR;
        state = block ? STATE_BLOCK_MATH : STATE_INLINE_MATH;
        idx = pos + (block ? 2 : 1);
        start = idx;
      } else {
        const block = md[pos + 1] === "`" && md[pos + 2] === "`";
        res += block ? "```" : "`";
        state = block ? STATE_BLOCK_CODE : STATE_INLINE_CODE;
        idx = pos + (block ? 3 : 1);
      }
    } else if (state >= STATE_INLINE_MATH) {
      const pos = find(md, idx, 0);
      if (pos === -1) {
        idx = len;
        break;
      }
      if (md[pos] === "\\") {
        idx = pos + (md[pos + 1] ? 2 : 1);
      } else {
        const inline = state === STATE_INLINE_MATH;
        if (inline || md[pos + 1] === DOLLAR) {
          const content = md.slice(start, pos),
            delim = inline ? DOLLAR : DOLLAR + DOLLAR;
          try {
            res += compile(content, !inline);
          } catch {
            res += delim + content + delim;
          }
          state = STATE_TEXT;
          idx = pos + (inline ? 1 : 2);
        } else {
          idx = pos + 1;
        }
      }
    } else {
      const inline = state === STATE_INLINE_CODE,
        delim = inline ? "`" : "```",
        pos = md.indexOf(delim, idx);
      if (pos === -1) {
        res += md.slice(idx);
        break;
      }
      res += md.slice(idx, pos) + delim;
      state = STATE_TEXT;
      idx = pos + delim.length;
    }
  }

  return state >= STATE_INLINE_MATH
    ? res + (state === STATE_INLINE_MATH ? DOLLAR : DOLLAR + DOLLAR) + md.slice(start)
    : res;
};
