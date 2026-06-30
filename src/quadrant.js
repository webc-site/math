import { body, esc } from "./pie.js";

// mermaid quadrantChart → SVG：四象限散点图

const parse = (src) => {
  let title = "";
  const xl = ["", ""],
    yl = ["", ""],
    quad = ["", "", "", ""],
    pts = [];
  for (const line of body(src)) {
    if (/^quadrantChart\b/.test(line) || /^acc(Title|Descr)\b/.test(line)) continue;
    let m;
    if (/^title\b/.test(line)) title = line.slice(5).trim();
    else if (/^x-axis\b/.test(line)) {
      const p = line.slice(6).split("-->");
      xl[0] = (p[0] || "").trim();
      xl[1] = (p[1] || "").trim();
    } else if (/^y-axis\b/.test(line)) {
      const p = line.slice(6).split("-->");
      yl[0] = (p[0] || "").trim();
      yl[1] = (p[1] || "").trim();
    } else if ((m = line.match(/^quadrant-([1-4])\s+(.+)/))) {
      quad[+m[1] - 1] = m[2].trim();
    } else if ((m = line.match(/^(.+?):\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/))) {
      pts.push([m[1].trim().replace(/^["']|["']$/g, ""), +m[2], +m[3]]);
    }
  }
  return [title, xl, yl, quad, pts];
};

const S = 360,
  OX = 90,
  OY = 50;

const render = (title, xl, yl, quad, pts) => {
  const px = (x) => OX + x * S,
    py = (y) => OY + (1 - y) * S,
    mid = S / 2,
    txt = (x, y, s, attr) => '<text x="' + x + '" y="' + y + '" ' + attr + ">" + esc(s) + "</text>";
  let g =
    '<rect x="' +
    OX +
    '" y="' +
    OY +
    '" width="' +
    S +
    '" height="' +
    S +
    '" fill="none" stroke="currentColor" stroke-opacity=".3"/>' +
    '<line x1="' +
    (OX + mid) +
    '" y1="' +
    OY +
    '" x2="' +
    (OX + mid) +
    '" y2="' +
    (OY + S) +
    '" stroke="currentColor" stroke-opacity=".15"/>' +
    '<line x1="' +
    OX +
    '" y1="' +
    (OY + mid) +
    '" x2="' +
    (OX + S) +
    '" y2="' +
    (OY + mid) +
    '" stroke="currentColor" stroke-opacity=".15"/>';
  // 象限标签：1 右上, 2 左上, 3 左下, 4 右下
  const qpos = [
    [OX + S * 0.75, OY + S * 0.5],
    [OX + S * 0.25, OY + S * 0.5],
    [OX + S * 0.25, OY + S * 0.95],
    [OX + S * 0.75, OY + S * 0.95],
  ];
  quad.forEach((q, i) => {
    if (q) g += txt(qpos[i][0], qpos[i][1], q, 'text-anchor="middle" font-size="12" opacity=".6"');
  });
  pts.forEach(([name, x, y], i) => {
    const cx = px(x),
      cy = py(y);
    g +=
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="6" fill="hsl(' +
      ((i * 47) % 360) +
      ' 70% 55%)"/>';
    g += txt(cx + 9, cy + 4, name, 'font-size="11"');
  });
  // 轴标签
  g += txt(OX, OY + S + 24, xl[0], 'font-size="12" opacity=".7"');
  g += txt(OX + S, OY + S + 24, xl[1], 'text-anchor="end" font-size="12" opacity=".7"');
  g += txt(OX - 12, OY + S, yl[0], 'text-anchor="end" font-size="12" opacity=".7"');
  g += txt(OX - 12, OY + 6, yl[1], 'text-anchor="end" font-size="12" opacity=".7"');
  const head = title
    ? txt(OX + mid, 28, title, 'text-anchor="middle" font-size="18" font-weight="700"')
    : "";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    (S + 130) +
    " " +
    (S + 90) +
    '" fill="currentColor">' +
    head +
    g +
    "</svg>"
  );
};

export default (src) => render(...parse(src));
