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
import lex from "./lex.js";
import parse from "./parse.js";

const MROW = "mrow",
  LEFT = "left",
  STYLES = [null, STYLE_BOX, STYLE_CANCEL, STYLE_SOUT],
  ALIGN_RL = ["right", LEFT],
  PAD_RL = [";padding-right:0", ";padding-left:0"],
  TAGS = [null, "mi", "mn", "mo"],
  ESC_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  },
  esc = (str) => str.replace(/[&<>"]/g, (m) => ESC_MAP[m]),
  wrap = (tag_name, inner, attr) =>
    "<" + tag_name + (attr || "") + ">" + inner + "</" + tag_name + ">",
  tag = (name, val, attr) => wrap(name, esc(val), attr),
  tblAttr = (align, space) =>
    ' columnalign="' + align + '" rowspacing=".2em" columnspacing="' + space + '"',
  cellStyle = (align, pad) => ' style="text-align:' + align + pad + '"',
  nest = (name, ...ns) => wrap(name, ns.map(row).join("")),
  scr = (n, idx, display, inline) =>
    nest(script(n[1], n[idx], display, inline), ...n.slice(1, idx)),
  row = (n) => {
    if (!n) return wrap(MROW, "");
    const [type, val] = n;
    return type === TYPE_GROUP && !val[1]
      ? row(val[0])
      : type === TYPE_GROUP || type === TYPE_FUNC
        ? wrap(MROW, show(n))
        : show(n);
  },
  script = ([, v], limits, display, inline) =>
    limits === 1 || (!limits && (v === "∑" || /^(lim|max|min|sup|inf)$/.test(v)))
      ? display
      : inline,
  SHOW_MAP = {
    [TYPE_FUNC]: ([, val]) => tag("mi", val) + wrap("mo", "\u2061"),
    [TYPE_GROUP]: ([, ns]) => ns.map(show).join(""),
    [TYPE_FRAC]: ([, n_1, n_2]) => nest("mfrac", n_1, n_2),
    [TYPE_SUP]: (n) => scr(n, 3, "mover", "msup"),
    [TYPE_SUB]: (n) => scr(n, 3, "munder", "msub"),
    [TYPE_SUPSUB]: (n) => scr(n, 4, "munderover", "msubsup"),
    [TYPE_TEXT]: ([, val]) => tag("mtext", val.replace(/ /g, "\u00A0")),
    [TYPE_SPACE]: ([, val]) => wrap("mspace", "", ' width="' + val + '"'),
    [TYPE_MSQRT]: ([, n_1]) => wrap("msqrt", row(n_1)),
    [TYPE_MROOT]: ([, n_1, n_2]) => nest("mroot", n_1, n_2),
    [TYPE_LEFT_RIGHT]: ([, ns]) => wrap(MROW, ns.map(show).join("")),
    [TYPE_OVERLINE]: ([, n_1]) => nest("mover", n_1, [TYPE_OP, "¯"]),
    [TYPE_MENCLOSE]: ([, style_id, node]) =>
      STYLES[style_id] ? wrap("mrow", row(node), STYLES[style_id]) : row(node),
    [TYPE_MPHANTOM]: ([, n_1]) => wrap("mphantom", row(n_1)),
    [TYPE_MATRIX]: (n) => {
      const [, env, rows] = n,
        is_cases = env === "cases",
        is_align = /^align|split/.test(env),
        has_rel =
          is_cases &&
          rows.every((r) => {
            const [t, v] = r[1]?.[0] || [];
            return !t || (t === TYPE_OP && "=<≤≥≠≈≡∝>".includes(v));
          }),
        row_0 = rows[0] || [],
        col_styles = row_0.map((_, i) =>
          is_cases
            ? cellStyle(LEFT, has_rel ? PAD_RL[i % 2] : "")
            : is_align
              ? cellStyle(ALIGN_RL[i % 2], PAD_RL[i % 2])
              : "",
        ),
        inner = rows
          .map((r) =>
            wrap(
              "mtr",
              r
                .map((c, i) => {
                  const html = c.map(show).join("");
                  return wrap("mtd", c[1] ? wrap(MROW, html) : html, col_styles[i] || "");
                })
                .join(""),
            ),
          )
          .join(""),
        tbl_attr = is_cases
          ? tblAttr(LEFT, has_rel ? "0" : "1em")
          : is_align
            ? tblAttr(
                row_0.map((_, i) => ALIGN_RL[i % 2]).join(" "),
                row_0
                  .slice(1)
                  .map((_, i) => (i % 2 ? "2em" : "0"))
                  .join(" "),
              )
            : "",
        tbl = wrap("mtable", inner, tbl_attr),
        idx = "pbvVc".indexOf(env[0]);

      if (idx >= 0) {
        const d_0 = "([|‖{"[idx],
          d_1 = ")]‖‖"[idx] || "";
        return wrap(MROW, tag("mo", d_0) + tbl + (d_1 && tag("mo", d_1)));
      }
      return tbl;
    },
    [TYPE_LINEBREAK]: () => wrap("mspace", "", ' linebreak="newline"'),
  },
  show = (n) => (n ? (n[0] <= 3 ? tag(TAGS[n[0]], n[1], n[2]) : SHOW_MAP[n[0]](n)) : "");

export default (tex, block) => {
  const clean = tex.replace(/[\r\n]+/g, " ");
  return wrap(
    "math",
    wrap(
      "semantics",
      wrap("mrow", parse(lex(clean), [0, 0]).map(show).join("")) +
        wrap("annotation", esc(clean), ' encoding="application/x-tex"'),
    ),
    ' xmlns="http://www.w3.org/1998/Math/MathML"' + (block ? ' display="block"' : ""),
  );
};
