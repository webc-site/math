import convert from "./mermaid.js";
import { dict, isRtl } from "./i18n.js";

// 体积/速度实测值（build.js 写入 stats.json，含兜底默认值）
// libs：自包含浏览器包(含依赖) gzip 体积，首项为本项目
let LIBS = [
    ["@webc.site/mermaid", 863],
    ["@probelabs/maid", 139307],
    ["beautiful-mermaid", 495196],
    ["mermaid", 974866],
  ],
  // sequence 渲染吞吐(ops/s)，首项为本项目（越高越好）
  SPEEDLIBS = [
    ["@webc.site/mermaid", 372000],
    ["beautiful-mermaid", 150678],
    ["@probelabs/maid", 51990],
    ["mermaid", 56],
  ];
const $ = (id) => document.getElementById(id),
  store = (k, v) => (v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v));

// beautiful-mermaid 的主题（tokens 取自其 src/theme.ts：[bg, fg, line, accent, muted]）
const TH = {
    "github-light": ["#ffffff", "#1f2328", "#d1d9e0", "#0969da", "#59636e"],
    "github-dark": ["#0d1117", "#e6edf3", "#3d444d", "#4493f8", "#9198a1"],
    "tokyo-night": ["#1a1b26", "#a9b1d6", "#3d59a1", "#7aa2f7", "#565f89"],
    "catppuccin-latte": ["#eff1f5", "#4c4f69", "#9ca0b0", "#8839ef", "#9ca0b0"],
    nord: ["#2e3440", "#d8dee9", "#4c566a", "#88c0d0", "#616e88"],
    dracula: ["#282a36", "#f8f8f2", "#6272a4", "#bd93f9", "#6272a4"],
    "solarized-light": ["#fdf6e3", "#657b83", "#93a1a1", "#268bd2", "#93a1a1"],
    "one-dark": ["#282c34", "#abb2bf", "#4b5263", "#c678dd", "#5c6370"],
  },
  THEMES = Object.keys(TH),
  applyTheme = (name) => {
    const [bg, fg, line, accent, muted] = TH[name] || TH["github-light"],
      r = document.documentElement.style;
    r.setProperty("--bg", bg);
    r.setProperty("--fg", fg);
    r.setProperty("--card", bg);
    r.setProperty("--border", line);
    r.setProperty("--muted", muted);
    r.setProperty("--accent", accent);
    r.setProperty("--accent-glow", accent + "1a");
    const tb = $("theme");
    if (tb) tb.title = "beautiful-mermaid: " + name;
  },
  // 示例：仅展示视觉上不同的图（专属渲染器各一个 + flowchart 代表所有「框+箭头」类）
  EXAMPLES = [
    {
      cap: "pie",
      src: 'pie title Pets\n  "Dogs" : 38\n  "Cats" : 26\n  "Rats" : 11\n  "Fish" : 9',
    },
    {
      cap: "xychart",
      src: 'xychart-beta\n  title "Monthly Sales"\n  x-axis [Jan, Feb, Mar, Apr, May, Jun]\n  y-axis 0 --> 300\n  bar [120, 200, 150, 80, 270, 240]',
    },
    {
      cap: "radar",
      src: 'radar-beta\n  axis a["Speed"], b["Power"], c["Range"]\n  axis d["Agility"], e["Defense"]\n  curve x["Hero"]{80, 90, 70, 85, 60}\n  curve y["Rival"]{70, 60, 90, 75, 80}\n  max 100',
    },
    {
      cap: "quadrant",
      src: "quadrantChart\n  title Effort vs Impact\n  x-axis Low --> High\n  y-axis Low --> High\n  quadrant-1 Do now\n  quadrant-2 Plan\n  quadrant-3 Drop\n  quadrant-4 Maybe\n  A: [0.3, 0.7]\n  B: [0.6, 0.85]\n  C: [0.4, 0.3]\n  D: [0.75, 0.45]",
    },
    {
      cap: "journey",
      src: "journey\n  title My Day\n  section Morning\n    Wake up: 3: Me\n    Coffee: 5: Me\n  section Work\n    Code: 4: Me, Team\n    Ship: 5: Me",
    },
    {
      cap: "gantt",
      src: "gantt\n  title Project\n  section Phase 1\n  Design   :a1, 2024-01-01, 20d\n  Build    :after a1, 30d\n  section Phase 2\n  Test     :2024-03-01, 15d",
    },
    {
      cap: "timeline",
      src: "timeline\n  title Tech Timeline\n  2007 : iPhone\n  2010 : iPad\n  2015 : Watch\n  2023 : Vision Pro",
    },
    {
      cap: "flowchart",
      src: "flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Do it]\n  B -->|No| D[Skip]\n  C --> E[End]\n  D --> E",
    },
  ];

// 渲染：把 mermaid 源码转成内联 SVG（失败则显示错误）
const render = (el, src) => {
  try {
    el.innerHTML = convert(src);
    el.classList.remove("err-box");
  } catch (e) {
    el.innerHTML = '<div class="err">⚠ ' + e.message + "</div>";
  }
};

// 通用四方纵向柱状图（本项目 + maid + beautiful-mermaid + mermaid）。跨度逾千倍，
// 用对数高度让各条都可见；标注呈现真实数值与「N×」倍数。lower=true 体积(越小越好)，否则速度(越高越好)。
const kb = (v) => (v >= 1024 ? (v / 1024).toFixed(v < 102400 ? 1 : 0) + " KB" : v + " B"),
  ops = (v) => (v >= 1000 ? Math.round(v / 1000) + "k/s" : v + "/s");
// 复刻 math.webc.site 的 3D 立体柱：渐变前面 + 顶面/侧面 + 本项目高亮(暖色+星标+阴影)
const barChart = (libs, fmt, lower) => {
  const max = Math.max(...libs.map(([, v]) => v)),
    base = libs[0][1],
    bw = 78,
    dx = 12,
    dy = 9,
    baseY = 205,
    gap = (760 - libs.length * (bw + dx)) / (libs.length + 1),
    F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    tx = (cx, y, s, col, size, w) =>
      `<text x="${cx}" y="${y}" fill="${col}" font-family="${F}" font-size="${size}" font-weight="${w}" text-anchor="middle">${s}</text>`;
  let bars = "";
  libs.forEach(([name, v], i) => {
    const x = gap + i * (bw + dx + gap),
      h = Math.max((Math.log(v) / Math.log(max)) * 150, 14),
      y = baseY - h,
      cx = x + bw / 2,
      ours = i === 0,
      front = ours ? "url(#bf)" : "#cbd5e1",
      side = ours ? "url(#bs)" : "#94a3b8",
      top = ours ? "#ff9d66" : "#e2e8f0",
      col = ours ? "#ff3e00" : "#64748b";
    bars +=
      `<path fill="${top}" d="M${x} ${y}l${dx} ${-dy}h${bw}l${-dx} ${dy}z"/>` +
      `<path fill="${side}" d="M${x + bw} ${y}l${dx} ${-dy}v${h}l${-dx} ${dy}z"/>` +
      `<path fill="${front}"${ours ? ' filter="url(#sh)"' : ""} d="M${x} ${y}h${bw}v${h}h${-bw}z"/>` +
      (ours
        ? tx(cx, y - 28, "★", col, 16, 700)
        : tx(cx, y - 27, Math.round(lower ? v / base : base / v) + "×", col, 11, 700)) +
      tx(cx, y - 12, fmt(v), col, 13, 700) +
      tx(cx, baseY + 22, name, ours ? col : "#475569", 12, ours ? 700 : 600);
  });
  return (
    '<svg viewBox="0 0 760 250" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="bf" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#ff7e40"/>' +
    '<stop offset="1" stop-color="#ff2e93"/></linearGradient>' +
    '<linearGradient id="bs" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#d9541a"/>' +
    '<stop offset="1" stop-color="#d91672"/></linearGradient>' +
    '<filter id="sh" width="160%" height="160%" x="-30%" y="-30%">' +
    '<feDropShadow dx="0" dy="4" flood-color="#ff5e00" flood-opacity=".25" stdDeviation="6"/></filter></defs>' +
    bars +
    "</svg>"
  );
};
const chart = () => barChart(LIBS, kb, true);
const speedPanel = (t) =>
  barChart(SPEEDLIBS, ops, false) + '<p class="tip">' + t.speed_note + "</p>";

let lang = store("lang") || (navigator.language || "en").slice(0, 2),
  theme = store("theme") || "github-light";

const apply = () => {
  const t = dict(lang);
  document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
  $("ui-subtitle").textContent = t.subtitle;
  $("ui-usage-title").textContent = t.usage_title;
  $("ui-usage-code").textContent =
    "// " +
    t.usage_comment +
    "\n" +
    "import convert from '@webc.site/mermaid'\n\n" +
    "const svg = convert(`pie title Pets\n" +
    '  "Dogs" : 30\n' +
    '  "Cats" : 15`)';
  $("ui-editor-title").textContent = t.editor_title;
  $("ui-editor-tip").textContent = t.editor_tip;
  $("ui-size-title").textContent = t.size_title;
  $("ui-size-tip").textContent = t.size_tip;
  $("ui-size-note").textContent = t.size_note;
  $("ui-speed-title").textContent = t.speed_title;
  $("ui-speed-tip").textContent = t.speed_tip;
  $("ui-examples-title").textContent = t.examples_title;
  $("ui-foot").textContent = t.foot;
  $("chart").innerHTML = chart(t);
  $("speed").innerHTML = speedPanel(t);

  $("gallery").innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid-cards";
  EXAMPLES.forEach((ex) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = "<h3>" + ex.cap + "</h3>";
    const box = document.createElement("div");
    render(box, ex.src);
    item.append(box);
    item.onclick = () => {
      $("src").value = ex.src;
      render($("preview"), ex.src);
      $("src").scrollIntoView({ behavior: "smooth", block: "center" });
    };
    grid.append(item);
  });
  $("gallery").append(grid);
};

const init = async () => {
  if (!THEMES.includes(theme)) theme = "github-light";
  applyTheme(theme);
  const stats = await fetch("./stats.json")
    .then((r) => r.json())
    .catch(() => null);
  if (stats) {
    if (stats.libs) LIBS = stats.libs;
    if (stats.speedLibs) SPEEDLIBS = stats.speedLibs;
  }
  // 语言选择：点地球图标弹出语言面板（对齐 math.webc.site 的交互）
  const langs = await (await fetch("./langs.json")).json(),
    grid = $("lang-grid"),
    panel = $("lang-panel");
  if (!langs.some(([c]) => c === lang)) lang = "en";
  langs.forEach(([code, name]) => {
    const b = document.createElement("button");
    b.className = "lang-chip" + (code === lang ? " on" : "");
    b.textContent = name;
    b.onclick = () => {
      lang = code;
      store("lang", lang);
      panel.hidden = true;
      grid.querySelectorAll(".on").forEach((e) => e.classList.remove("on"));
      b.classList.add("on");
      apply();
    };
    grid.append(b);
  });
  $("lang-btn").onclick = (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
  };
  panel.onclick = (e) => {
    if (e.target === panel) panel.hidden = true;
  };
  $("theme").onclick = () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    store("theme", theme);
    applyTheme(theme);
  };

  const ta = $("src");
  ta.value = EXAMPLES[0].src;
  ta.oninput = () => render($("preview"), ta.value);
  render($("preview"), ta.value);
  apply();
};

init();
