import pie, { body } from "./pie.js";
import xychart from "./xychart.js";
import timeline from "./timeline.js";
import quadrant from "./quadrant.js";
import journey from "./journey.js";
import radar from "./radar.js";
import gantt from "./gantt.js";
import graph from "./graph.js";
import strict from "./strict.js";

// 按图首行关键字派发到对应渲染器；未匹配则抛错。
// 专用渲染器优先；大量「框+箭头」类与长尾类型走通用 graph 渲染器。
const RENDER = [
  [/^pie\b/, pie],
  [/^xychart\b/, xychart],
  [/^timeline\b/, timeline],
  [/^quadrantChart\b/, quadrant],
  [/^journey\b/, journey],
  [/^radar\b/, radar],
  [/^gantt\b/, gantt],
  // 通用渲染器覆盖的类型
  [/^erDiagram\b/, graph],
  [/^classDiagram\b/, (s) => strict("class", s)],
  [/^stateDiagram\b/, (s) => strict("state", s)],
  [/^sequenceDiagram\b/, (s) => strict("sequence", s)],
  [/^flowchart\b/, (s) => strict("flowchart", s)],
  [/^graph\b/, (s) => strict("flowchart", s)],
  [/^gitGraph\b/, graph],
  [/^C4\w+/, graph],
  [/^mindmap\b/, graph],
  [/^requirementDiagram\b/, graph],
  [/^architecture\b/, graph],
  [/^block\b/, graph],
  [/^sankey\b/, graph],
  [/^packet\b/, graph],
  [/^info\b/, graph],
  [/^kanban\b/, graph],
  [/^zenuml\b/, graph],
  [/^eventmodeling\b/, graph],
  [/^swimlane\b/, graph],
  [/^wardley\b/, graph],
  [/^treeView\b/, graph],
  [/^treemap\b/, graph],
  [/^venn\b/, graph],
  [/^ishikawa\b/, graph],
  [/^cynefin\b/, graph],
  [/^railroad\b/, graph],
];

export default (src) => {
  const h = body(src)[0] || "";
  for (const [re, fn] of RENDER) {
    if (re.test(h)) return fn(src);
  }
  throw Error("UNSUPPORTED");
};
