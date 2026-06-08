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
import { STYLE_BOX, STYLE_CANCEL, STYLE_SOUT } from "./const/STYL.js";
import { NOTATION_BOX, NOTATION_CANCEL, NOTATION_SOUT } from "./const/NOTATION.js";
import { LIMITS_DISPLAY, LIMITS_INLINE } from "./const/LIMITS.js";
import lex from "./lex.js";
import parse from "./parse.js";

const ENV_DELIMS = {
    __proto__: null,
    pmatrix: ["(", ")"],
    bmatrix: ["[", "]"],
    vmatrix: ["|", "|"],
    Vmatrix: ["‖", "‖"],
    cases: ["{", ""],
  },
  MROW = "mrow",
  NOTATION_STYLE_MAP = {
    [NOTATION_BOX]: STYLE_BOX,
    [NOTATION_CANCEL]: STYLE_CANCEL,
    [NOTATION_SOUT]: STYLE_SOUT,
  },
  LIMITS_FUNCS = {
    __proto__: null,
    lim: 1,
    max: 1,
    min: 1,
    sup: 1,
    inf: 1,
  },
  ESC_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  },
  esc = (str) => str.replace(/[&<>"]/g, (m) => ESC_MAP[m]),
  wrap = (tag_name, inner, attr) =>
    "<" + tag_name + (attr ?? "") + ">" + inner + "</" + tag_name + ">",
  tag = (name, val, attr) => wrap(name, esc(val), attr),
  nest = (name, n1, n2, n3) => wrap(name, row(n1) + row(n2) + (n3 ? row(n3) : "")),
  row = (n) => {
    if (!n) return wrap(MROW, "");
    const [type, val] = n;
    return type === TYPE_GROUP
      ? val[1]
        ? wrap(MROW, val.map(show).join(""))
        : row(val[0])
      : type === TYPE_FUNC
        ? wrap(MROW, show(n))
        : show(n);
  },
  script = (n1, limits, display, inline) =>
    limits === LIMITS_DISPLAY ||
    (limits !== LIMITS_INLINE && (n1[1] === "∑" || (n1[0] === TYPE_FUNC && LIMITS_FUNCS[n1[1]])))
      ? display
      : inline,
  SHOW_MAP = {
    [TYPE_IDENT]: (n) => tag("mi", n[1], n[2]),
    [TYPE_NUM]: (n) => tag("mn", n[1]),
    [TYPE_OP]: (n) => tag("mo", n[1], n[2]),
    [TYPE_FUNC]: (n) => tag("mi", n[1]) + "<mo>\u2061</mo>",
    [TYPE_GROUP]: (n) => n[1].map(show).join(""),
    [TYPE_FRAC]: (n) => nest("mfrac", n[1], n[2]),
    [TYPE_SUP]: (n) => nest(script(n[1], n[3], "mover", "msup"), n[1], n[2]),
    [TYPE_SUB]: (n) => nest(script(n[1], n[3], "munder", "msub"), n[1], n[2]),
    [TYPE_SUPSUB]: (n) => nest(script(n[1], n[4], "munderover", "msubsup"), n[1], n[2], n[3]),
    [TYPE_TEXT]: (n) => tag("mtext", n[1].replace(/ /g, "\u00A0")),
    [TYPE_SPACE]: (n) => '<mspace width="' + n[1] + '"></mspace>',
    [TYPE_MSQRT]: (n) => wrap("msqrt", row(n[1])),
    [TYPE_MROOT]: (n) => nest("mroot", n[1], n[2]),
    [TYPE_LEFT_RIGHT]: (n) => wrap(MROW, n[1].map(show).join("")),
    [TYPE_OVERLINE]: (n) => nest("mover", n[1], [TYPE_OP, "¯"]),
    [TYPE_MENCLOSE]: (n) => {
      const style = NOTATION_STYLE_MAP[n[1]];
      return style ? "<mrow" + style + ">" + row(n[2]) + "</mrow>" : row(n[2]);
    },
    [TYPE_MPHANTOM]: (n) => wrap("mphantom", row(n[1])),
    [TYPE_MATRIX]: (n) => {
      const inner = n[2]
          .map((r) =>
            wrap(
              "mtr",
              r
                .map((c) => {
                  const html = c.map(show).join("");
                  return wrap("mtd", c[1] ? wrap(MROW, html) : html);
                })
                .join(""),
            ),
          )
          .join(""),
        tbl = wrap("mtable", inner),
        del = ENV_DELIMS[n[1]];
      if (del) {
        const [d0, d1] = del;
        return wrap(MROW, (d0 ? tag("mo", d0) : "") + tbl + (d1 ? tag("mo", d1) : ""));
      }
      return tbl;
    },
    [TYPE_LINEBREAK]: () => '<mspace linebreak="newline"></mspace>',
  },
  show = (n) => (n ? SHOW_MAP[n[0]](n) : "");

export default (tex, block) => {
  const clean = tex.includes("\n") || tex.includes("\r") ? tex.replace(/[\r\n]+/g, " ") : tex;
  return (
    '<math xmlns="http://www.w3.org/1998/Math/MathML"' +
    (block ? ' display="block"' : "") +
    "><semantics><mrow>" +
    parse(lex(clean), [0]).map(show).join("") +
    '</mrow><annotation encoding="application/x-tex">' +
    esc(clean) +
    "</annotation></semantics></math>"
  );
};
