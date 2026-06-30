import { body, esc } from "./pie.js";

// mermaid journey → SVG：用户旅程，按 section 分行，任务按评分(1-5)着色

const parse = (src) => {
  let title = "",
    cur = null;
  const sections = [];
  for (const line of body(src)) {
    if (/^journey\b/.test(line) || /^acc(Title|Descr)\b/.test(line)) continue;
    if (/^title\b/.test(line)) {
      title = line.slice(5).trim();
    } else if (/^section\b/.test(line)) {
      cur = [line.slice(7).trim(), []];
      sections.push(cur);
    } else if (line.includes(":")) {
      const p = line.split(":").map((s) => s.trim());
      if (!cur) {
        cur = ["", []];
        sections.push(cur);
      }
      cur[1].push([p[0], +p[1] || 0, p[2] || ""]);
    }
  }
  return [title, sections];
};

// 评分 1-5 → 红到绿
const score = (s) => "hsl(" + Math.max(0, Math.min(120, (s - 1) * 30)) + " 65% 55%)";

const render = (title, sections) => {
  const bw = 150,
    gap = 14,
    top = title ? 54 : 24;
  let g = "",
    y = top,
    w = 240;
  sections.forEach(([name, tasks]) => {
    if (name) {
      g +=
        '<text x="20" y="' +
        (y + 16) +
        '" font-size="14" font-weight="700">' +
        esc(name) +
        "</text>";
      y += 26;
    }
    tasks.forEach(([tn, sc, actors], i) => {
      const x = 20 + i * (bw + gap);
      g +=
        '<rect x="' +
        x +
        '" y="' +
        y +
        '" width="' +
        bw +
        '" height="56" rx="10" fill="' +
        score(sc) +
        '" fill-opacity=".85"/>';
      g +=
        '<text x="' +
        (x + bw / 2) +
        '" y="' +
        (y + 24) +
        '" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">' +
        esc(tn) +
        "</text>";
      g +=
        '<text x="' +
        (x + bw / 2) +
        '" y="' +
        (y + 42) +
        '" text-anchor="middle" font-size="11" fill="#fff" opacity=".85">' +
        (sc ? "★" + sc + " " : "") +
        esc(actors) +
        "</text>";
      w = Math.max(w, x + bw + 20);
    });
    y += 72;
  });
  const head = title
    ? '<text x="20" y="32" font-size="18" font-weight="700">' + esc(title) + "</text>"
    : "";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    w +
    " " +
    (y + 8) +
    '" fill="currentColor">' +
    head +
    g +
    "</svg>"
  );
};

export default (src) => render(...parse(src));
