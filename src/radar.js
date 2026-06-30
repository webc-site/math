import { body, esc } from "./pie.js";

// mermaid radar-beta → SVG：雷达/蜘蛛图
const labels = (s) =>
    (s.match(/\[([^\]]*)\]/g) || []).map((x) => x.slice(1, -1).replace(/^["']|["']$/g, ""));

const parse = (src) => {
  const axes = [],
    curves = [];
  let max = null,
    min = 0;
  for (const line of body(src)) {
    if (line.startsWith("radar")) continue;
    if (/^axis\b/.test(line)) axes.push(...labels(line));
    else if (/^curve\b/.test(line)) {
      const name = (labels(line)[0] ?? "").trim(),
        m = line.match(/\{([^}]*)\}/),
        vals = m ? (m[1].match(/-?\d+(?:\.\d+)?/g) || []).map(Number) : [];
      curves.push([name, vals]);
    } else if (/^max\b/.test(line)) max = +(line.match(/-?\d+(?:\.\d+)?/) || [0])[0];
    else if (/^min\b/.test(line)) min = +(line.match(/-?\d+(?:\.\d+)?/) || [0])[0];
  }
  return [axes, curves, max, min];
};

const CX = 200,
  CY = 200,
  R = 150;

const render = (axes, curves, max, min) => {
  const n = Math.max(axes.length, ...curves.map(([, v]) => v.length), 1),
    hi = max ?? Math.max(...curves.flatMap(([, v]) => v), 1),
    span = hi - min || 1,
    pt = (i, r) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    };
  let g = "";
  // 网格 + 轴
  for (let ring = 1; ring <= 4; ++ring) {
    const pts = [];
    for (let i = 0; i < n; ++i)
      pts.push(
        pt(i, (R * ring) / 4)
          .map((v) => v.toFixed(1))
          .join(","),
      );
    g +=
      '<polygon points="' +
      pts.join(" ") +
      '" fill="none" stroke="currentColor" stroke-opacity=".12"/>';
  }
  for (let i = 0; i < n; ++i) {
    const [x, y] = pt(i, R);
    g +=
      '<line x1="' +
      CX +
      '" y1="' +
      CY +
      '" x2="' +
      x.toFixed(1) +
      '" y2="' +
      y.toFixed(1) +
      '" stroke="currentColor" stroke-opacity=".15"/>';
    if (axes[i]) {
      const [lx, ly] = pt(i, R + 18);
      g +=
        '<text x="' +
        lx.toFixed(1) +
        '" y="' +
        ly.toFixed(1) +
        '" text-anchor="middle" font-size="12">' +
        esc(axes[i]) +
        "</text>";
    }
  }
  curves.forEach(([name, vals], ci) => {
    const col = "hsl(" + ((ci * 67) % 360) + " 70% 50%)",
      pts = vals
        .map((v, i) =>
          pt(i, (R * (v - min)) / span)
            .map((x) => x.toFixed(1))
            .join(","),
        )
        .join(" ");
    g +=
      '<polygon points="' +
      pts +
      '" fill="' +
      col +
      '" fill-opacity=".18" stroke="' +
      col +
      '" stroke-width="2"/>';
    if (name)
      g +=
        '<text x="16" y="' +
        (24 + ci * 18) +
        '" font-size="12" fill="' +
        col +
        '" font-weight="600">■ ' +
        esc(name) +
        "</text>";
  });
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 410" fill="currentColor">' +
    g +
    "</svg>"
  );
};

export default (src) => render(...parse(src));
