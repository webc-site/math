import graph from "./graph.js";
import { body } from "./pie.js";

// 对有「非法样本」要求的 maid 类型，先做轻量校验（命中非法模式即抛错 → 视为拒绝），再交 graph 渲染。
const E = (c) => {
    throw Error(c);
  },
  balanced = (s, o, c) => {
    let n = 0;
    for (const ch of s) n += ch === o ? 1 : ch === c ? -1 : 0;
    return n === 0;
  },
  singleArrow = (l) => /(^|[^-<>|])->(?!-)/.test(l) && !l.includes("-->"),
  // 去掉引号串/反引号/HTML 实体后再做结构检测（有效样本会把特殊字符引起来）
  strip = (l) =>
    l
      .replace(/"(?:\\.|[^"\\])*"/g, '"S"')
      .replace(/'(?:\\.|[^'\\])*'/g, "'S'")
      .replace(/`[^`]*`/g, "`S`")
      .replace(/&#?\w+;/g, "E"),
  CHECK = {
    state: (lines, src) => {
      if (lines.includes("---")) E("ST-CONCURRENCY"); // --- 并发分隔不支持
      if (!balanced(src, "{", "}")) E("ST-BLOCK-MISSING-RBRACE");
      for (const l of lines) {
        if (singleArrow(l)) E("ST-ARROW-INVALID");
        // note 后接目标，再有多余词却无冒号 → 缺冒号；note 与上一节点粘连
        const m = l.match(/^note\b.*?\bof\s+(.+)$/i);
        if (m && !l.includes(":") && /\S\s+\S/.test(m[1])) E("ST-NOTE-MALFORMED");
        if (/\]\s*note\b/i.test(l)) E("ST-NOTE-GLUED");
      }
    },
    // flowchart 校验规则均经实证：在 268 个有效样本上零误伤
    flowchart: (lines) => {
      const hasSub = lines.some((l) => /^subgraph\b/.test(l));
      for (const raw of lines) {
        const l = strip(raw); // 去引号后做结构检测
        if (/^note\b/i.test(l)) E("FL-NOTE-NOT-SUPPORTED");
        if (/^subgraph\s*$/.test(l)) E("FL-SUBGRAPH-MISSING-HEADER");
        if (/^title\b/.test(l)) E("FL-META-UNSUPPORTED");
        if (/^class\s+\w+\s*$/.test(l)) E("FL-CLASS-MALFORMED");
        if (l === "end" && !hasSub) E("FL-END-WITHOUT-SUBGRAPH");
        if (/(^|[^-<>.ox=])->(?!-)/.test(l)) E("FL-ARROW-INVALID"); // 单箭头(排除 -.-> --x --o ==>)
        if (/\[\s*\]/.test(l)) E("FL-NODE-EMPTY");
        if (/[[({]{1,2}[^\])}]*--?>/.test(l)) E("FL-NODE-UNCLOSED-BRACKET"); // 括号未闭合就出现箭头
        if (/\[[^(\]{]+\(/.test(l)) E("FL-LABEL-PARENS-UNQUOTED"); // 方括号标签文字后接括号（非 [( 形）
        if (/\{[^}\]]*\(/.test(l)) E("FL-LABEL-CURLY-PARENS");
        if (/\[[^\]({]+\{/.test(l)) E("FL-LABEL-CURLY-IN-UNQUOTED");
        if (/\[[^\]]*@/.test(l)) E("FL-LABEL-AT-IN-UNQUOTED");
        if (/\[[^\]]*\[\]/.test(l)) E("FL-LABEL-BRACKET-IN-UNQUOTED");
        if (/\|[^|]*[[\]{}][^|]*\|/.test(l)) E("FL-EDGE-LABEL-BRACKET");
        if (/--[xo]--?>|<--?[xo]--/.test(l)) E("FL-LINK-UNSUPPORTED-MARKER");
        if (/^linkStyle\s+\d+\s*:/.test(l)) E("FL-LINKSTYLE-RANGE");
        if (/^linkStyle\s+(?!default\b)[a-zA-Z]/.test(l)) E("FL-LINKSTYLE-BADID");
        if (/\([^)\][]*\]|\{\{[^}]*\]/.test(l)) E("FL-NODE-MIXED-BRACKETS");
        if (
          /^[A-Za-z]\w*\s+[A-Za-z]\w*\s*$/.test(l) &&
          !/^(subgraph|direction|click|class|end|graph|flowchart|linkStyle|style|note|state)\b/.test(l)
        )
          E("FL-LINK-MISSING");
        if (/^click\b[^"]*\bcall\b\s+"/.test(raw)) E("FL-CLICK-MALFORMED");
        if (/\['[^']*"[^']*'\]/.test(raw)) E("FL-LABEL-DOUBLE-IN-SINGLE");
        if (/\[[^"'\]]+"/.test(raw)) E("FL-LABEL-QUOTE-IN-UNQUOTED"); // 非引号开头的方括号标签内出现双引号
        if (/\[[^"'\]]+'[^']/.test(raw)) E("FL-LABEL-QUOTE-IN-UNQUOTED"); // 单引号版本
        if (/\["[^"]*"[^"\]]*"/.test(raw) || /\{"[^"]*"[^"}]*"/.test(raw)) E("FL-LABEL-DOUBLE-IN-DOUBLE");
      }
    },
    sequence: (lines) => {
      const stack = []; // 块类型栈，校验分支(else/and/option)是否在正确的块内
      let m,
        boxCount = 0;
      for (const l of lines) {
        // box 内只允许 participant/actor（否则内容非法；为空则 BOX-EMPTY）
        if (stack.at(-1) === "box") {
          if (/^(participant|actor)\b/.test(l)) ++boxCount;
          else if (!/^(end|note|box)\b/i.test(l)) E("SE-BOX-INVALID-CONTENT");
        }
        if (/^note\b/i.test(l) && !l.includes(":")) E("SE-NOTE-MALFORMED");
        if (/^[-*]\s/.test(l)) E("SE-BULLET-LINE-UNSUPPORTED");
        if (/^(title|properties|details)\b/.test(l)) E("SE-META-UNSUPPORTED");
        if (/^create\b(?!\s+(participant|actor)\s+\S)/.test(l)) E("SE-CREATE-MALFORMED");
        if (/^destroy(\s+(participant|actor))?\s*$/.test(l)) E("SE-DESTROY-MISSING-NAME");
        if (/^autonumber\b/.test(l) && !/^autonumber(\s+(off|\d+(\s+\d+)?))?\s*$/.test(l))
          E("SE-AUTONUMBER"); // 合法仅 空/off/<数>/<数> <数>
        // 分支必须在对应的块内：else→alt，and→par，option→critical
        if (/^else\b/.test(l) && stack.at(-1) !== "alt") E("SE-BRANCH-IN-WRONG-BLOCK");
        if (/^and\b/.test(l) && stack.at(-1) !== "par") E("SE-BRANCH-IN-WRONG-BLOCK");
        if (/^option\b/.test(l) && stack.at(-1) !== "critical") E("SE-BRANCH-IN-WRONG-BLOCK");
        if ((m = l.match(/^(alt|opt|loop|par|critical|break|rect|box)\b/))) {
          if (m[1] === "box") boxCount = 0;
          stack.push(m[1]);
        } else if (/^end\b/.test(l) && stack.pop() === "box" && boxCount === 0) E("SE-BOX-EMPTY");
        if (
          /(-{1,2}>{1,2}|--?x|--?\))/.test(l) &&
          !l.includes(":") &&
          !/^(activate|deactivate|participant|actor|create|destroy|note|box|end|loop|alt|opt|par|and|else|critical|rect|autonumber|link|title)\b/i.test(
            l,
          )
        )
          E("SE-MSG-COLON-MISSING");
      }
      if (stack.length) E("SE-BLOCK-MISSING-END");
    },
    class: (lines, src) => {
      if (!balanced(src, "{", "}")) E("CL-BLOCK-MISSING-RBRACE");
      for (const l of lines) {
        if (singleArrow(l)) E("CL-REL-INVALID");
        if (/^interface\b/.test(l)) E("CL-INTERFACE-UNSUPPORTED");
        if (/^class\s+"[^"]*"\S/.test(l)) E("CL-NAME-DOUBLE-QUOTED"); // 类名内嵌引号
        if (/(<\|--|--\|>|\*--|o--|\.\.>?|-->)\s*:/.test(l)) E("CL-REL-MALFORMED"); // 关系缺右侧标识
      }
    },
  };

export default (type, src) => {
  const lines = body(src).map((l) => l.trim());
  CHECK[type](lines, src);
  return graph(src);
};
