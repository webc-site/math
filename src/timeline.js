import { body, esc } from "./pie.js";

// mermaid timeline → SVG：时间轴，每个时期一列，事件竖向排列

const parse = (src) => {
  let title = "";
  const periods = [];
  for (const line of body(src)) {
    if (/^timeline\b/.test(line)) continue;
    if (/^acc(Title|Descr)\b/.test(line)) continue;
    if (/^title\b/.test(line)) {
      title = line.slice(5).trim();
    } else if (/^section\b/.test(line)) {
      // 分组仅作分隔，简化渲染时忽略
    } else if (line.includes(":")) {
      const parts = line.split(":").map((s) => s.trim()),
        period = parts[0],
        events = parts.slice(1).filter(Boolean);
      if (period) periods.push([period, events]);
      else if (periods.length) periods[periods.length - 1][1].push(...events);
    }
  }
  return [title, periods];
};

const render = (title, periods) => {
  const colW = 180,
    W = Math.max(periods.length * colW + 40, 240),
    top = title ? 56 : 24,
    fill = (i) => "hsl(" + ((i * 47) % 360) + " 60% 92%)",
    line = (i) => "hsl(" + ((i * 47) % 360) + " 55% 50%)";
  let g = "",
    h = top + 40;
  periods.forEach(([period, events], i) => {
    const x = 20 + i * colW + colW / 2,
      ly = line(i);
    g += '<circle cx="' + x + '" cy="' + top + '" r="6" fill="' + ly + '"/>';
    g +=
      '<text x="' +
      x +
      '" y="' +
      (top - 12) +
      '" text-anchor="middle" font-size="14" font-weight="700">' +
      esc(period) +
      "</text>";
    events.forEach((ev, j) => {
      const y = top + 26 + j * 46;
      g +=
        '<rect x="' +
        (x - 78) +
        '" y="' +
        y +
        '" width="156" height="38" rx="8" fill="' +
        fill(i) +
        '" stroke="' +
        ly +
        '"/>';
      g +=
        '<text x="' +
        x +
        '" y="' +
        (y + 23) +
        '" text-anchor="middle" font-size="12">' +
        esc(ev) +
        "</text>";
      h = Math.max(h, y + 50);
    });
  });
  g =
    '<line x1="20" y1="' +
    top +
    '" x2="' +
    (W - 20) +
    '" y2="' +
    top +
    '" stroke="currentColor" stroke-opacity=".2"/>' +
    g;
  const head = title
    ? '<text x="' +
      W / 2 +
      '" y="30" text-anchor="middle" font-size="18" font-weight="700">' +
      esc(title) +
      "</text>"
    : "";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    W +
    " " +
    h +
    '" fill="currentColor">' +
    head +
    g +
    "</svg>"
  );
};

export default (src) => render(...parse(src));
