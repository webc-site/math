import { body, esc } from "./pie.js";

// 通用「框 + 箭头」渲染器：宽松抽取节点/连边，分层布局。供多种图类型兜底，绝不抛错。
const // 连接符：各种箭头 / 连线 / 序列消息
  EDGE = /\s(?:--+>?|-\.+->?|==+>?|<?-+>|->>?|--|::|:)\s/,
  // 从一侧文本提取 [id, 显示标签]
  side = (s) => {
    const t = s
        .trim()
        .replace(/^[|>+*-]+|[|<+*-]+$/g, "")
        .trim(),
      m = t.match(/^([\w.-]+)\s*[[({]+\s*"?([^\])}"]*)"?\s*[\])}]*/);
    if (m) return [m[1], (m[2] || m[1]).trim()];
    const id = t.replace(/["'[\](){}]/g, "").split(/\s|:/)[0] || t;
    return [id, t.replace(/["'[\](){}]/g, "").trim() || id];
  };

const parse = (src) => {
  const lines = body(src),
    nodes = new Map(),
    edges = [];
  let title = "";
  const add = (id, label) => {
    if (id && (!nodes.has(id) || (label && label !== id))) nodes.set(id, label || id);
  };
  for (const line of lines) {
    if (/^(title)\b/.test(line)) {
      title = line.slice(5).trim();
      continue;
    }
    if (/^(acc(Title|Descr)|direction|section)\b/.test(line)) continue;
    const m = line.match(EDGE);
    if (m) {
      const idx = m.index,
        [a, la] = side(line.slice(0, idx)),
        [b, lb] = side(line.slice(idx + m[0].length));
      add(a, la);
      add(b, lb);
      if (a && b) edges.push([a, b]);
    } else {
      // 独立节点声明（如 class Foo / state X / [label]）
      const [id, label] = side(line);
      if (id && /[\w[]/.test(line)) add(id, label);
    }
  }
  return [title, nodes, edges];
};

// 分层：按最长入边路径定层（带迭代上限防环）
const layers = (nodes, edges) => {
  const ids = [...nodes.keys()],
    lvl = new Map(ids.map((id) => [id, 0])),
    inc = new Map(ids.map((id) => [id, 0]));
  for (const [, b] of edges) if (inc.has(b)) inc.set(b, inc.get(b) + 1);
  for (let pass = 0; pass < ids.length + 2; ++pass) {
    let moved = false;
    for (const [a, b] of edges) {
      if (lvl.has(a) && lvl.has(b) && lvl.get(b) <= lvl.get(a) && inc.get(b) > 0) {
        lvl.set(b, lvl.get(a) + 1);
        moved = true;
      }
    }
    if (!moved) break;
  }
  const cols = [];
  for (const id of ids) {
    const k = Math.min(lvl.get(id), ids.length);
    (cols[k] ||= []).push(id);
  }
  return cols.filter(Boolean);
};

const BW = 130,
  BH = 40,
  GX = 70,
  GY = 22;

const render = (src) => {
  const [title, nodes, edges] = parse(src);
  if (!nodes.size) {
    // 无可识别结构：列出源码行，保证产出合法 SVG
    const ls = body(src).slice(0, 14);
    const rows = ls
      .map(
        (l, i) =>
          '<text x="14" y="' +
          (28 + i * 20) +
          '" font-size="12">' +
          esc(l.slice(0, 80)) +
          "</text>",
      )
      .join("");
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ' +
      (40 + ls.length * 20) +
      '" fill="currentColor">' +
      rows +
      "</svg>"
    );
  }
  const cols = layers(nodes, edges),
    pos = new Map(),
    top = title ? 50 : 20;
  let maxRow = 0;
  cols.forEach((col, ci) => {
    col.forEach((id, ri) => {
      pos.set(id, [40 + ci * (BW + GX), top + ri * (BH + GY)]);
      maxRow = Math.max(maxRow, ri);
    });
  });
  const W = 80 + cols.length * (BW + GX),
    Hh = top + (maxRow + 1) * (BH + GY);
  let g = "";
  for (const [a, b] of edges) {
    const pa = pos.get(a),
      pb = pos.get(b);
    if (!pa || !pb) continue;
    g +=
      '<line x1="' +
      (pa[0] + BW) +
      '" y1="' +
      (pa[1] + BH / 2) +
      '" x2="' +
      pb[0] +
      '" y2="' +
      (pb[1] + BH / 2) +
      '" stroke="currentColor" stroke-opacity=".4"/>';
  }
  for (const [id, [x, y]] of pos) {
    g +=
      '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      BW +
      '" height="' +
      BH +
      '" rx="8" fill="#6366f1" fill-opacity=".15" stroke="#6366f1"/>';
    g +=
      '<text x="' +
      (x + BW / 2) +
      '" y="' +
      (y + BH / 2 + 4) +
      '" text-anchor="middle" font-size="12">' +
      esc((nodes.get(id) || id).slice(0, 18)) +
      "</text>";
  }
  const head = title
    ? '<text x="40" y="32" font-size="18" font-weight="700">' + esc(title) + "</text>"
    : "";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    W +
    " " +
    Hh +
    '" fill="currentColor">' +
    head +
    g +
    "</svg>"
  );
};

export default render;
