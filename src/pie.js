// mermaid pie 饼图 → SVG（并对外提供共用工具 esc / body）
export const esc = (s) =>
  s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
const unquote = (s) => ("\"'".includes(s[0]) && s.at(-1) === s[0] ? s.slice(1, -1) : s),
  // 一行数据：带引号标签（支持 \" 转义，但内部不能出现未转义的同种引号）+ 冒号 + 数字
  ROW = /^(["'])((?:\\.|(?!\1)[^\\])*)\1\s*:\s*(-?[\d.]+)$/,
  // 去开头 frontmatter、%% 注释/指令、空行后的有效行
  body = (src) =>
    src
      .replace(/^[ \t]*---[ \t]*\r?\n[\s\S]*?\r?\n[ \t]*---[ \t]*\r?\n/, "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("%%"));

const parse = (src) => {
  const ls = body(src),
    head = ls[0] || "";
  if (!/^pie\b/.test(head)) throw Error("GEN-HEADER-INVALID");

  let rest = head.slice(3).trim(),
    title = "";
  if (rest.startsWith("showData")) rest = rest.slice(8).trim();
  if (/^title\b/.test(rest)) title = unquote(rest.slice(5).trim());

  const data = [];
  for (let i = 1; i < ls.length; ++i) {
    const line = ls[i];
    if (/^acc(Title|Descr)\b/.test(line)) continue;
    if (/^title\b/.test(line)) {
      title = unquote(line.slice(5).trim());
      continue;
    }
    const m = ROW.exec(line);
    if (!m) throw Error("PI-ROW-INVALID");
    data.push(Number(m[3]));
  }
  return [title, data];
};

// 用 stroke-dasharray 圆环法画饼：每片是一个只描绘自身弧段的圆，无需三角函数与路径
const C = Math.PI * 140; // 半径 70 的圆周长

const render = (title, data) => {
  let total = 0,
    off = 0,
    slices = "";
  for (const v of data) total += v;
  total ||= 1;
  for (let i = 0; i < data.length; ++i) {
    const len = (data[i] / total) * C;
    slices +=
      '<circle cx="160" cy="200" r="70" stroke="hsl(' +
      ((i * 47) % 360) +
      ' 70% 55%)" stroke-dasharray="' +
      len +
      " " +
      C +
      '" stroke-dashoffset="' +
      -off +
      '"/>';
    off += len;
  }
  const head = title
    ? '<text x="160" y="32" text-anchor="middle" font-size="20" font-weight="700">' +
      esc(title) +
      "</text>"
    : "";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 390">' +
    head +
    '<g fill="none" stroke-width="140">' +
    slices +
    "</g></svg>"
  );
};

export { body };
export default (src) => render(...parse(src));
