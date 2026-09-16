import { TYPE_OP, TYPE_GROUP, TYPE_FUNC } from "./const/TYPE.js";
import { STYLE_BOX, STYLE_CANCEL, STYLE_SOUT } from "./const/STYL.js";
import lex from "./lex.js";
import parse from "./parse.js";

const MROW = "mrow",
  LEFT = "left",
  START = "start",
  STYLES = [null, STYLE_BOX, STYLE_CANCEL, STYLE_SOUT],
  ALIGN_RL = ["right", LEFT],
  PAD_RL = [";padding-right:0", ";padding-left:0"],
  JUSTIFY = ' style="justify-items:',
  STYLE_ALIGN = PAD_RL.map((p, i) => JUSTIFY + (i ? START : "end") + p + '"'),
  STYLE_CASES_REL = PAD_RL.map((p) => JUSTIFY + START + p + '"'),
  STYLE_START = JUSTIFY + START + '"',
  TAGS = [null, "mi", "mn", "mo"],
  esc = (str) => str.replace(/[&<>"]/g, (m) => "&#" + m.charCodeAt(0) + ";"),
  wrap = (tag_name, inner, attr) =>
    "<" + tag_name + (attr || "") + ">" + inner + "</" + tag_name + ">",
  tag = (name, val, attr) => wrap(name, esc(val), attr),
  tblAttr = (align, space, row_space = ".2em", extra = "") =>
    extra +
    ' columnalign="' +
    align +
    '" rowspacing="' +
    row_space +
    '" columnspacing="' +
    space +
    '"',
  nest = (name, ...ns) => wrap(name, ns.map(row).join("")),
  flat = (ns) => wrap(MROW, ns.map(show).join("")),
  scr = (n, idx, display, inline, [, v] = n[1], limits = n[idx]) =>
    nest(
      limits === 1 || (!limits && /^([∑∏∐⋂⋃⨁⨂⋁⋀]|lim|max|min|sup|inf)$/.test(v)) ? display : inline,
      ...n.slice(1, idx),
    ),
  row = (n) => {
    if (!n) return wrap(MROW, "");
    const [type, val] = n;
    return type === TYPE_GROUP && !val[1]
      ? row(val[0])
      : type === TYPE_GROUP || type === TYPE_FUNC
        ? wrap(MROW, show(n))
        : show(n);
  },
  // 按 TYPE.js 数字码位置排列的渲染函数表，1-3 走 tag 路径，连同 0 留空位
  SHOW_MAP = [
    ,
    ,
    ,
    ,
    (n) => scr(n, 3, "mover", "msup"),
    (n) => scr(n, 3, "munder", "msub"),
    (n) => scr(n, 4, "munderover", "msubsup"),
    ([, n_1, n_2]) => nest("mfrac", n_1, n_2),
    ([, ns]) => ns.map(show).join(""),
    ([, val]) => tag("mi", val) + wrap("mo", "\u2061"),
    ([, n_1]) => wrap("msqrt", row(n_1)),
    ([, n_1, n_2]) => nest("mroot", n_1, n_2),
    ([, ns]) => flat(ns),
    ([, n_1, op]) => nest("mover", n_1, [TYPE_OP, op]),
    (n) => {
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
            ? has_rel
              ? STYLE_CASES_REL[i % 2]
              : STYLE_START
            : is_align
              ? STYLE_ALIGN[i % 2]
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
                ".6em",
                ' displaystyle="true"',
              )
            : "",
        tbl = wrap("mtable", inner, tbl_attr),
        idx = "pbvVc".indexOf(env[0]);

      return idx >= 0
        ? wrap(MROW, tag("mo", "([|‖{"[idx]) + tbl + (idx < 4 ? tag("mo", ")]‖‖"[idx]) : ""))
        : tbl;
    },
    () => wrap("mspace", "", ' linebreak="newline"'),
    ([, val]) => tag("mtext", val.replace(/ /g, "\u00A0")),
    ([, val]) => wrap("mspace", "", ' width="' + val + '"'),
    ([, style_id, node]) =>
      STYLES[style_id] ? wrap(MROW, row(node), STYLES[style_id]) : row(node),
    ([, n_1]) => wrap("mphantom", row(n_1)),
  ],
  show = (n) => (n ? (n[0] <= 3 ? tag(TAGS[n[0]], n[1], n[2]) : SHOW_MAP[n[0]](n)) : "");

export default (tex, block) => {
  const clean = tex.replace(/[\r\n]+/g, " ");
  return wrap(
    "math",
    wrap(
      "semantics",
      flat(parse(lex(clean), [0, 0])) +
        wrap("annotation", esc(clean), ' encoding="application/x-tex"'),
    ),
    ' xmlns="http://www.w3.org/1998/Math/MathML"' + (block ? ' display="block"' : ""),
  );
};
