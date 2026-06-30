import { body, esc } from "./pie.js";

// mermaid gantt → SVG：甘特图。宽松解析：能解析日期就按日期定位，否则顺延上一任务
const SKIP =
    /^(gantt|dateFormat|axisFormat|excludes|todayMarker|tickInterval|weekday|inclusiveEndDates|topAxis)\b/,
  // 时长转天：支持 d/w/h/m/s/ms，默认天
  days = (s) => {
    const m = s.match(/(\d+(?:\.\d+)?)\s*(ms|w|h|d|m|s)?/);
    if (!m) return 1;
    const n = +m[1],
      u = m[2] || "d";
    return u === "w"
      ? n * 7
      : u === "h"
        ? n / 24
        : u === "m"
          ? n / 1440
          : u === "s"
            ? n / 86400
            : u === "ms"
              ? n / 864e5
              : n;
  };

const parse = (src) => {
  let title = "",
    section = "",
    cursor = 0,
    base = null;
  const tasks = [],
    end = {};
  for (const line of body(src)) {
    if (/^acc(Title|Descr)\b/.test(line) || SKIP.test(line)) continue;
    if (/^title\b/.test(line)) {
      title = line.slice(5).trim();
    } else if (/^section\b/.test(line)) {
      section = line.slice(7).trim();
    } else if (line.includes(":")) {
      const ci = line.indexOf(":"),
        name = line.slice(0, ci).trim(),
        parts = line
          .slice(ci + 1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      let dur = 1,
        start = null,
        dep = null,
        status = "",
        milestone = false,
        id = null;
      for (const p of parts) {
        if (/^(done|active|crit)$/.test(p)) status = p;
        else if (p === "milestone") milestone = true;
        else if (/^after\b/.test(p)) dep = p.replace(/^after\s+/, "").split(/\s+/)[0];
        else if (/^\d{4}-\d\d/.test(p) && !Number.isNaN(Date.parse(p))) {
          const t = Date.parse(p);
          if (base === null) base = t;
          start = (t - base) / 864e5;
        } else if (/^\d/.test(p)) dur = days(p);
        else id = p;
      }
      const st = start ?? (dep && end[dep] != null ? end[dep] : cursor),
        en = st + (milestone ? 0 : dur);
      cursor = en;
      if (id) end[id] = en;
      tasks.push([name, section, st, en, status, milestone]);
    }
  }
  return [title, tasks];
};

const L = 150,
  RH = 26;

const render = (title, tasks) => {
  const top = title ? 50 : 20,
    lo = Math.min(0, ...tasks.map(([, , s]) => s)),
    hi = Math.max(1, ...tasks.map(([, , , e]) => e)),
    span = hi - lo || 1,
    PW = 540,
    x = (d) => L + ((d - lo) / span) * PW,
    color = { crit: "#ef4444", active: "#3b82f6", done: "#94a3b8" };
  let g = "",
    last = null;
  tasks.forEach(([name, section, st, en, status, ms], i) => {
    const y = top + i * RH;
    if (section !== last) {
      g +=
        '<text x="12" y="' +
        (y + 17) +
        '" font-size="12" font-weight="700" opacity=".75">' +
        esc(section) +
        "</text>";
      last = section;
    }
    g +=
      '<text x="' +
      (L - 8) +
      '" y="' +
      (y + 17) +
      '" text-anchor="end" font-size="11">' +
      esc(name) +
      "</text>";
    if (ms) {
      const cx = x(st);
      g += '<path d="M' + cx + " " + (y + 6) + 'l7 7l-7 7l-7-7z" fill="#f59e0b"/>';
    } else {
      g +=
        '<rect x="' +
        x(st) +
        '" y="' +
        (y + 4) +
        '" width="' +
        Math.max(x(en) - x(st), 2) +
        '" height="16" rx="4" fill="' +
        (color[status] || "#6366f1") +
        '" fill-opacity=".85"/>';
    }
  });
  const head = title
    ? '<text x="12" y="30" font-size="18" font-weight="700">' + esc(title) + "</text>"
    : "";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    (L + PW + 20) +
    " " +
    (top + tasks.length * RH + 12) +
    '" fill="currentColor">' +
    head +
    g +
    "</svg>"
  );
};

export default (src) => render(...parse(src));
