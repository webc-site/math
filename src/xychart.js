import { body, esc } from "./pie.js";

// mermaid xychart(-beta) → SVG：柱状图 / 折线图
const unq = (s) => s.replace(/^\s*["']|["']\s*$/g, "").trim(),
  nums = (s) => (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number),
  // 解析 [a, b, "c, d", ...]：支持带引号、含逗号的项
  items = (s) => {
    const inner = s.slice(s.indexOf("[") + 1, s.lastIndexOf("]")),
      out = [];
    let buf = "",
      q = "";
    for (const c of inner) {
      if (q) {
        if (c === q) q = "";
        else buf += c;
      } else if (c === '"' || c === "'") {
        q = c;
      } else if (c === ",") {
        out.push(buf.trim());
        buf = "";
      } else {
        buf += c;
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out.map(unq);
  };

const parse = (src) => {
  let title = "",
    cats = null,
    ymin = null,
    ymax = null;
  const series = [];
  for (const line of body(src)) {
    if (/^title\b/.test(line)) title = unq(line.slice(5));
    else if (/^x-axis\b/.test(line)) {
      if (line.includes("[")) cats = items(line);
    } else if (/^y-axis\b/.test(line)) {
      const r = nums(line);
      if (r.length >= 2) [ymin, ymax] = r.slice(-2);
    } else if (/^bar\b/.test(line)) series.push([0, nums(line)]);
    else if (/^line\b/.test(line)) series.push([1, nums(line)]);
  }
  return [title, cats, ymin, ymax, series];
};

const W = 720,
  H = 420,
  L = 56,
  R = 18,
  TOP = 48,
  BOT = 52,
  PW = W - L - R,
  PH = H - TOP - BOT;

const render = (title, cats, ymin, ymax, series) => {
  const vals = series.flatMap(([, d]) => d),
    n = Math.max(cats ? cats.length : 0, ...series.map(([, d]) => d.length), 1),
    lo = ymin ?? Math.min(0, ...vals, 0),
    hiRaw = ymax ?? Math.max(...vals, 1),
    hi = hiRaw === lo ? lo + 1 : hiRaw,
    sy = (v) => TOP + PH - ((v - lo) / (hi - lo)) * PH,
    slot = PW / n,
    cx = (i) => L + slot * (i + 0.5),
    fill = (i) => "hsl(" + ((i * 47) % 360) + " 70% 55%)";
  // 坐标轴：一条折线画 y 轴 + x 轴
  const axis = TOP + PH,
    nbar = Math.max(series.filter(([t]) => t === 0).length, 1),
    y0 = sy(Math.max(lo, 0));
  let g =
    '<path d="M' + L + " " + TOP + "L" + L + " " + axis + "L" + (L + PW) + " " + axis +
    '" fill="none" stroke="currentColor" stroke-opacity=".3"/>';
  // 系列
  series.forEach(([type, d], si) => {
    if (type === 0) {
      const bw = (slot * 0.6) / nbar;
      d.forEach((v, i) => {
        const y = sy(v);
        g +=
          '<rect x="' +
          (cx(i) - bw / 2) +
          '" y="' +
          Math.min(y, y0) +
          '" width="' +
          bw +
          '" height="' +
          Math.abs(y0 - y) +
          '" rx="2" fill="' +
          fill(si) +
          '"/>';
      });
    } else {
      const pts = d.map((v, i) => cx(i) + "," + sy(v)).join(" ");
      g +=
        '<polyline points="' +
        pts +
        '" fill="none" stroke="' +
        fill(si) +
        '" stroke-width="2.5" stroke-linejoin="round"/>';
    }
  });
  // x 轴标签
  if (cats) {
    cats.forEach((c, i) => {
      g +=
        '<text x="' +
        cx(i) +
        '" y="' +
        (TOP + PH + 18) +
        '" text-anchor="middle" font-size="11" fill="currentColor" opacity=".7">' +
        esc(c) +
        "</text>";
    });
  }
  const head = title
    ? '<text x="' +
      W / 2 +
      '" y="28" text-anchor="middle" font-size="18" font-weight="700">' +
      esc(title) +
      "</text>"
    : "";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" fill="currentColor">' +
    head +
    g +
    "</svg>"
  );
};

export default (src) => render(...parse(src));
