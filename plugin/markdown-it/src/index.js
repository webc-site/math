import compile from "@webc.site/math";

const isValidDelim = (state, pos) => {
  const max = state.posMax;
  let prev = pos > 0 ? state.src.charCodeAt(pos - 1) : -1,
    next = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1,
    open = true,
    close = true;

  if (prev === 0x20 || prev === 0x09 || (next >= 0x30 && next <= 0x39)) {
    close = false;
  }
  if (next === 0x20 || next === 0x09) {
    open = false;
  }

  return [open, close];
};

const mathInline = (state, silent) => {
  if (state.src[state.pos] !== "$") {
    return false;
  }

  const [open] = isValidDelim(state, state.pos),
    start = state.pos + 1;

  if (!open) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos += 1;
    return true;
  }

  let match = start;
  while ((match = state.src.indexOf("$", match)) !== -1) {
    let idx = match - 1;
    while (state.src[idx] === "\\") {
      idx -= 1;
    }

    if ((match - idx) % 2 === 1) {
      break;
    }
    match += 1;
  }

  if (match === -1) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos = start;
    return true;
  }

  if (match - start === 0) {
    if (!silent) {
      state.pending += "$$";
    }
    state.pos = start + 1;
    return true;
  }

  const [_, close] = isValidDelim(state, match);
  if (!close) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos = start;
    return true;
  }

  if (!silent) {
    const token = state.push("math_inline", "math", 0);
    token.markup = "$";
    token.content = state.src.slice(start, match);
  }

  state.pos = match + 1;
  return true;
};

const mathBlock = (state, start, end, silent) => {
  let idx = state.bMarks[start] + state.tShift[start];
  const max = state.eMarks[start];

  if (idx + 2 > max) {
    return false;
  }
  if (state.src.slice(idx, idx + 2) !== "$$") {
    return false;
  }

  idx += 2;
  let first = state.src.slice(idx, max),
    found = false,
    last = "",
    next = start;

  if (silent) {
    return true;
  }
  if (first.trim().slice(-2) === "$$") {
    first = first.trim().slice(0, -2);
    found = true;
  }

  while (!found) {
    next += 1;

    if (next >= end) {
      break;
    }

    idx = state.bMarks[next] + state.tShift[next];
    const lim = state.eMarks[next];

    if (idx < lim && state.tShift[next] < state.blkIndent) {
      break;
    }

    if (state.src.slice(idx, lim).trim().slice(-2) === "$$") {
      const pos = state.src.slice(0, lim).lastIndexOf("$$");
      last = state.src.slice(idx, pos);
      found = true;
    }
  }

  state.line = next + 1;

  const token = state.push("math_block", "math", 0);
  token.block = true;
  token.content =
    (first && first.trim() ? first + "\n" : "") +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (last && last.trim() ? last : "");
  token.map = [start, state.line];
  token.markup = "$$";
  return true;
};

export default (md) => {
  const inline = (tokens, idx) => compile(tokens[idx].content, false),
    block = (tokens, idx) => compile(tokens[idx].content, true) + "\n";

  md.inline.ruler.after("escape", "math_inline", mathInline);
  md.block.ruler.after("blockquote", "math_block", mathBlock, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.renderer.rules.math_inline = inline;
  md.renderer.rules.math_block = block;
};
