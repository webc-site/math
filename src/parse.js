import {
  ERR_EXTRA_END,
  ERR_MISSING_RIGHT,
  ERR_EXTRA_RIGHT,
  ERR_MISSING_BRACE,
  ERR_UNKNOWN_CMD,
} from "./const/ERR.js";
import {
  TYPE_IDENT,
  TYPE_NUM,
  TYPE_OP,
  TYPE_SUP,
  TYPE_SUB,
  TYPE_SUPSUB,
  TYPE_FRAC,
  TYPE_GROUP,
  TYPE_FUNC,
  TYPE_MSQRT,
  TYPE_MROOT,
  TYPE_LEFT_RIGHT,
  TYPE_OVERLINE,
  TYPE_MATRIX,
  TYPE_LINEBREAK,
  TYPE_TEXT,
  TYPE_SPACE,
  TYPE_MENCLOSE,
  TYPE_MPHANTOM,
} from "./const/TYPE.js";

import {
  ATTR_NORMAL,
  ATTR_BOLD,
  ATTR_DOUBLE_STRUCK,
  ATTR_SCRIPT,
  ATTR_FRAKTUR,
  ATTR_SANSSERIF,
  ATTR_MONOSPACE,
  ATTR_ITALIC,
  ATTR_BOLD_ITALIC,
  ATTR_STRETCHY_FALSE,
  ATTR_BAR,
} from "./const/ATTR.js";
import { SYM_MAP } from "./const/SYM.js";
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
} from "./const/TOK.js";

const MENCLOSE_MAP = {
    __proto__: null,
    boxed: 1,
    cancel: 2,
    sout: 3,
  },
  CHAR_MAP = {
    "-": [TYPE_OP, "−"],
    "*": [TYPE_OP, "∗"],
    "/": [TYPE_OP, "/", ATTR_NORMAL],
    "|": [TYPE_OP, "|", ATTR_BAR],
    ".": [TYPE_OP, ".", ATTR_NORMAL],
    "'": [TYPE_OP, "′"],
  },
  delim = (tokens, ref) => {
    const idx = ref[0];
    if (tokens[idx] == null) return null;
    ref[0] += 2;
    const val = tokens[idx + 1];
    if (val === ".") return [TYPE_OP, "", ' fence="true" stretchy="true" symmetric="true"'];
    return [TYPE_OP, val === "<" ? "⟨" : val === ">" ? "⟩" : val[0] === "\\" ? val.slice(1) : val];
  },
  opt = (tokens, ref, check_num) => {
    let idx = ref[0];
    if (
      tokens[idx] === TOK_OP &&
      tokens[idx + 1] === "[" &&
      (!check_num || tokens[idx + 2] === TOK_NUM)
    ) {
      idx += 2;
      while (tokens[idx] > 0 && (tokens[idx] !== TOK_OP || tokens[idx + 1] !== "]")) {
        idx += 2;
      }
      tokens[idx] > 0 && (idx += 2);
      ref[0] = idx;
    }
  },
  brace = (tokens, ref) => {
    let idx = ref[0],
      str = "";
    if (tokens[idx] === TOK_LBRACE) {
      idx += 2;
      for (; tokens[idx] > 0 && tokens[idx] !== TOK_RBRACE; idx += 2) {
        str += tokens[idx + 1];
      }
      tokens[idx] > 0 && (idx += 2);
      ref[0] = idx;
    }
    return str;
  },
  rows = (tokens, ref, end_check, env) => {
    const rows = [];
    let row = [],
      cell = [];
    while (tokens[ref[0]] > 0) {
      const type = tokens[ref[0]],
        val = tokens[ref[0] + 1];
      if (!end_check && type === TOK_RBRACE) break;
      if (end_check && type === TOK_CMD && val === "\\end") {
        const pos = ref[0];
        ref[0] += 2;
        const end = brace(tokens, ref);
        if (end === env) {
          break;
        }
        ref[0] = pos;
      }
      if (val === "&" || val === "\\\\") {
        ref[0] += 2;
        row.push(cell);
        cell = [];
        if (val === "\\\\") {
          opt(tokens, ref, 1);
          rows.push(row);
          row = [];
        }
        continue;
      }
      const node = grab(tokens, ref);
      if (node) cell.push(node);
    }
    cell.length && row.push(cell);
    row.length && rows.push(row);
    if (rows.length && !rows[rows.length - 1][1] && !rows[rows.length - 1][0][0]) {
      rows.pop();
    }
    return rows;
  },
  matrix = (tokens, ref, name) => {
    if (tokens[ref[0]] === TOK_LBRACE) {
      ref[0] += 2;
      const res = rows(tokens, ref, 0, name);
      tokens[ref[0]] > 0 && (ref[0] += 2);
      return [TYPE_MATRIX, name, res];
    }
    const node = read(tokens, ref, 1);
    return node ? [TYPE_MATRIX, name, [[[node]]]] : null;
  },
  txt = (tokens, ref) => {
    if (tokens[ref[0]] === TOK_LBRACE) {
      const val = brace(tokens, ref);
      if (val === "") return [TYPE_GROUP, []];
      const parts = val.split("\\\\");
      if (parts.length > 1) {
        return [
          TYPE_GROUP,
          parts.flatMap((p, i) => [
            ...(i ? [[TYPE_LINEBREAK]] : []),
            ...(p ? [[TYPE_TEXT, p]] : []),
          ]),
        ];
      }
      return [TYPE_TEXT, val];
    }
    const node = read(tokens, ref, 1);
    if (node) {
      return [TYPE_TEXT, node[1]];
    }
    throw [ERR_MISSING_BRACE, "text"];
  },
  begin = (tokens, ref, val) => {
    if (tokens[ref[0]] === TOK_LBRACE) {
      const env = brace(tokens, ref);
      if (env === "array") {
        opt(tokens, ref);
        if (tokens[ref[0]] === TOK_LBRACE) brace(tokens, ref);
        else read(tokens, ref);
      }
      const res = rows(tokens, ref, 1, env);
      return [TYPE_MATRIX, env, res];
    }
    return [TYPE_IDENT, val];
  },
  sqrt = (tokens, ref) => {
    if (tokens[ref[0]] === TOK_OP && tokens[ref[0] + 1] === "[") {
      ref[0] += 2;
      const nodes = [];
      while (tokens[ref[0]] > 0 && (tokens[ref[0]] !== TOK_OP || tokens[ref[0] + 1] !== "]")) {
        const node = grab(tokens, ref);
        if (node) nodes.push(node);
      }
      if (tokens[ref[0]] === TOK_OP) ref[0] += 2;
      return [TYPE_MROOT, read(tokens, ref, 1), [TYPE_GROUP, nodes]];
    }
    return [TYPE_MSQRT, read(tokens, ref, 1)];
  },
  fence = (tokens, ref) => {
    const left = delim(tokens, ref),
      body = parse(tokens, ref);
    if (tokens[ref[0]] === TOK_CMD && tokens[ref[0] + 1] === "\\right") {
      ref[0] += 2;
      return [TYPE_LEFT_RIGHT, [left, ...body, delim(tokens, ref)].filter(Boolean)];
    }
    throw [ERR_MISSING_RIGHT, left];
  },
  fontNode = (node, attr) => {
    if (!node) return node;
    const [type, val] = node;
    if (type === TYPE_IDENT || type === TYPE_NUM) return [type, val, attr];
    if (type === TYPE_GROUP) return [type, val.map((n) => fontNode(n, attr))];
    if ((type >= TYPE_SUP && type <= TYPE_SUPSUB) || type === TYPE_OVERLINE) {
      const res = [...node];
      res[1] = fontNode(res[1], attr);
      return res;
    }
    return node;
  },
  mathFont = (attr) => (tokens, ref) => fontNode(read(tokens, ref, 1), attr),
  accent = (op) => (tokens, ref) => [TYPE_OVERLINE, read(tokens, ref, 1), op],
  over = accent("¯"),
  mover = (tokens, ref) => {
    const top = read(tokens, ref, 1);
    return [TYPE_SUP, read(tokens, ref, 1), top, 1];
  },
  munder = (tokens, ref) => {
    const bot = read(tokens, ref, 1);
    return [TYPE_SUB, read(tokens, ref, 1), bot, 1];
  },
  frac = (tokens, ref) => [TYPE_FRAC, read(tokens, ref, 1), read(tokens, ref, 1)],
  phantom = (tokens, ref) => [TYPE_MPHANTOM, read(tokens, ref, 1)],
  pmod = (tokens, ref) => [
    TYPE_GROUP,
    [
      [TYPE_SPACE, "8px"],
      CHAR_MAP["("],
      [TYPE_TEXT, "mod"],
      [TYPE_SPACE, "4px"],
      read(tokens, ref, 1),
      CHAR_MAP[")"],
    ],
  ],
  CMD_MAP = {
    __proto__: null,
    "\\": (tokens, ref) => {
      tokens[ref[0]] === TOK_OP && tokens[ref[0] + 1] === "*" && (ref[0] += 2);
      opt(tokens, ref, 1);
      return [TYPE_LINEBREAK];
    },
    text: txt,
    textrm: txt,
    textbf: txt,
    textit: txt,
    textsf: txt,
    texttt: txt,
    frac,
    dfrac: frac,
    tfrac: frac,
    cfrac: frac,
    overline: over,
    bar: over,
    hat: accent("^"),
    widehat: accent("^"),
    tilde: accent("~"),
    widetilde: accent("~"),
    vec: accent("→"),
    dot: accent("˙"),
    ddot: accent("¨"),
    check: accent("ˇ"),
    widecheck: accent("ˇ"),
    acute: accent("´"),
    grave: accent("`"),
    breve: accent("˘"),
    mathring: accent("˚"),
    stackrel: mover,
    overset: mover,
    underset: munder,
    mathbf: mathFont(ATTR_BOLD),
    boldsymbol: mathFont(ATTR_BOLD_ITALIC),
    bm: mathFont(ATTR_BOLD_ITALIC),
    mathrm: mathFont(ATTR_NORMAL),
    mathbb: mathFont(ATTR_DOUBLE_STRUCK),
    bb: mathFont(ATTR_DOUBLE_STRUCK),
    mathcal: mathFont(ATTR_SCRIPT),
    cal: mathFont(ATTR_SCRIPT),
    mathfrak: mathFont(ATTR_FRAKTUR),
    frak: mathFont(ATTR_FRAKTUR),
    mathsf: mathFont(ATTR_SANSSERIF),
    sf: mathFont(ATTR_SANSSERIF),
    mathtt: mathFont(ATTR_MONOSPACE),
    tt: mathFont(ATTR_MONOSPACE),
    mathit: mathFont(ATTR_ITALIC),
    it: mathFont(ATTR_ITALIC),
    rm: mathFont(ATTR_NORMAL),
    bf: mathFont(ATTR_BOLD),
    operatorname: (tokens, ref) => {
      tokens[ref[0]] === TOK_OP && tokens[ref[0] + 1] === "*" && (ref[0] += 2);
      const node = read(tokens, ref, 1);
      return [
        TYPE_FUNC,
        node ? (node[0] === TYPE_GROUP ? node[1].map((n) => n[1]).join("") : node[1]) : "",
      ];
    },
    tag: (tokens, ref) => [
      TYPE_GROUP,
      [[TYPE_SPACE, "2em"], CHAR_MAP["("], read(tokens, ref, 1), CHAR_MAP[")"]],
    ],
    sqrt,
    left: fence,
    phantom,
    pmod,
    begin,
    end: (tokens, ref, val, name) => {
      throw [ERR_EXTRA_END, name];
    },
    right: (tokens, ref, val, name) => {
      throw [ERR_EXTRA_RIGHT, name];
    },
  },
  TOK_MAP = {
    [TOK_IDENT]: (val) => [TYPE_IDENT, val],
    [TOK_OP]: (val) => CHAR_MAP[val] ?? [TYPE_OP, val],
    [TOK_NUM]: (val) => [TYPE_NUM, val],
    [TOK_LBRACE]: (val, tokens, ref) => {
      const res = [TYPE_GROUP, parse(tokens, ref)];
      tokens[ref[0]] > 0 && (ref[0] += 2);
      return res;
    },
    [TOK_CMD]: (val, tokens, ref) => {
      const name = val.slice(1),
        handler = CMD_MAP[name];
      if (handler) return handler(tokens, ref, val, name);
      if (/^(?:[pbvV]?matrix|cases|array)$/.test(name)) {
        const mat = matrix(tokens, ref, name);
        if (mat) return mat;
      }
      if (MENCLOSE_MAP[name]) {
        return [TYPE_MENCLOSE, MENCLOSE_MAP[name], read(tokens, ref, 1)];
      }
      const sym = SYM_MAP[name];
      if (sym) return sym;
      throw [ERR_UNKNOWN_CMD, val];
    },
  },
  read = (tokens, ref, split_num) => {
    const idx = ref[0],
      type = tokens[idx],
      offset = ref[1];
    if (!type) return null;
    let val = tokens[idx + 1];
    offset && (val = val.slice(offset));
    if (split_num && type === TOK_NUM && val[1]) {
      ref[1] = offset + 1;
      val = val[0];
    } else {
      ref[0] += 2;
      ref[1] = 0;
    }
    return TOK_MAP[type](val, tokens, ref);
  },
  grab = (tokens, ref) => {
    const base = read(tokens, ref),
      idx = ref[0];
    if (!base) return null;
    let limits = tokens[idx + 1] === "\\limits" ? 1 : tokens[idx + 1] === "\\nolimits" ? 2 : 0,
      sub,
      sup,
      type;
    limits && (ref[0] += 2);
    while ((type = tokens[ref[0]]) > 0) {
      let count = 0;
      for (; tokens[ref[0] + 1] === "'"; ref[0] += 2) ++count;
      if (count) {
        sup = [TYPE_OP, "′".repeat(count)];
        continue;
      }
      if (type !== TOK_SUB && type !== TOK_SUP) break;
      ref[0] += 2;
      if (type === TOK_SUB) sub = read(tokens, ref, 1);
      else sup = read(tokens, ref, 1);
    }
    return sub
      ? sup
        ? [TYPE_SUPSUB, base, sub, sup, limits]
        : [TYPE_SUB, base, sub, limits]
      : sup
        ? [TYPE_SUP, base, sup, limits]
        : base;
  },
  parse = (tokens, ref) => {
    const nodes = [];
    let type;
    while ((type = tokens[ref[0]]) > 0) {
      if (type === TOK_RBRACE) break;
      if (type === TOK_CMD && tokens[ref[0] + 1] === "\\right") break;
      const node = grab(tokens, ref);
      if (node) nodes.push(node);
    }
    return nodes;
  };

[..."()[]"].map((c) => (CHAR_MAP[c] = [TYPE_OP, c, ATTR_STRETCHY_FALSE]));

export default parse;
