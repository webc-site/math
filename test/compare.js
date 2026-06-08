import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import { minify } from "html-minifier";
import convert from "../lib/md.js";
import compile from "../lib/mathml.js";

const getSingleChild = (html) => {
    if (!html.startsWith("<") || !html.endsWith(">")) return null;
    const match = html.match(/^<([a-zA-Z0-9:-]+)(?:\s+[^>]*)?>/);
    if (!match) return null;
    let tag_depth = 0;
    let i = 0;
    const len = html.length;
    while (i < len) {
      if (html[i] === "<") {
        if (html[i + 1] === "/") {
          const close_end = html.indexOf(">", i);
          if (close_end === -1) return null;
          --tag_depth;
          i = close_end + 1;
          if (tag_depth === 0) {
            if (i === len) {
              return html;
            }
            return null;
          }
        } else if (html[i + 1] === "!" || html[i + 1] === "?") {
          const end = html.indexOf(">", i);
          if (end === -1) return null;
          i = end + 1;
        } else {
          const end = html.indexOf(">", i);
          if (end === -1) return null;
          if (html[end - 1] !== "/") {
            ++tag_depth;
          }
          i = end + 1;
        }
      } else {
        if (tag_depth === 0 && html[i].trim() !== "") {
          return null;
        }
        ++i;
      }
    }
    return null;
  },
  stripMrow = (html) => {
    let idx = 0;
    while (true) {
      idx = html.indexOf("<mrow>", idx);
      if (idx === -1) break;
      let depth = 1;
      let i = idx + 6;
      const len = html.length;
      let match_end = -1;
      while (i < len) {
        if (html.startsWith("<mrow>", i)) {
          ++depth;
          i += 6;
        } else if (html.startsWith("</mrow>", i)) {
          --depth;
          if (depth === 0) {
            match_end = i;
            break;
          }
          i += 7;
        } else {
          ++i;
        }
      }
      if (match_end !== -1) {
        const content = html.slice(idx + 6, match_end);
        const single = getSingleChild(content);
        if (single) {
          const tag_match = single.match(/^<([a-zA-Z0-9:-]+)/);
          if (
            tag_match &&
            /^(?:mi|mn|mo|mrow|mfrac|msup|msub|msubsup|mover|munder|munderover|msqrt|mroot|mtable)$/.test(
              tag_match[1],
            )
          ) {
            html = html.slice(0, idx) + content + html.slice(match_end + 7);
            continue;
          }
        }
      }
      ++idx;
    }
    return html;
  },
  RULES = [
    [
      /<mrow\s+style="display:\s*inline-block;\s*border:\s*1px\s+solid;\s*padding:\s*2px\s+3px\s*">(.*?)<\/mrow>/gi,
      '<menclose notation="box">$1</menclose>',
    ],
    [
      /<mrow\s+style="display:\s*inline-block;\s*background:\s*linear-gradient\(\s*to\s+top\s+right\s*,\s*transparent\s+47%\s*,\s*currentColor\s+47%\s*,\s*currentColor\s+53%\s*,\s*transparent\s+53%\s*\)\s*">(.*?)<\/mrow>/gi,
      '<menclose notation="updiagonalstrike">$1</menclose>',
    ],
    [
      /<mrow\s+style="display:\s*inline-block;\s*background:\s*linear-gradient\(\s*transparent\s+47%\s*,\s*currentColor\s+47%\s*,\s*currentColor\s+53%\s*,\s*transparent\s+53%\s*\)\s*">(.*?)<\/mrow>/gi,
      '<menclose notation="horizontalstrike">$1</menclose>',
    ],
    [/\s*data-[a-zA-Z-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?/g, ""],
    [/\s*display\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/g, ""],
    [
      /\s*(?:mathvariant|lspace|rspace|stretchy|xmlns|movablelimits|fence|symmetric|accent|rowspacing|columnspacing|columnalign|rowalign|align|columnlines|rowlines|framespacing|frame|equalrows|equalcolumns|displaystyle|separator)\b(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?/g,
      "",
    ],
    [/<mstyle[^>]*>/g, ""],
    [/<\/mstyle>/g, ""],
    [/<menclose[^>]*>/g, ""],
    [/<\/menclose>/g, ""],
    [/<mtext>(.*?)<\/mtext>/g, "<mi>$1</mi>"],
    [/<\/mn><mn>/g, ""],
    [
      /&#x([0-9a-fA-F]+);/g,
      (m, hex) => {
        const c = String.fromCharCode(parseInt(hex, 16));
        return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c;
      },
    ],
    [
      /&#([0-9]+);/g,
      (m, dec) => {
        const c = String.fromCharCode(parseInt(dec, 10));
        return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c;
      },
    ],
    [/<mo>&#x2061;<\/mo>/g, ""],
    [/<mo>&#8289;<\/mo>/g, ""],
    [/<mo>\u2061<\/mo>/g, ""],
    [/\u2061/g, ""],
    [
      /<mo>(lim|sin|cos|tan|log|ln|exp|max|min|sup|inf|det|gcd|arcsin|arccos|arctan|sinh|cosh|tanh)<\/mo>/g,
      "<mi>$1</mi>",
    ],
    [/[\u203E\u2015\u02C9]/g, "\u00AF"],
    [/\u22EF/g, "\u2026"],
    [
      /<mo>(.*?)<\/mo>/g,
      (m, content) => {
        const parts = content.match(/&[a-zA-Z]+;|./g) || [];
        return parts.map((c) => "<mo>" + c + "</mo>").join("");
      },
    ],
    [/<mo><\/mo>/g, ""],
    [/width\s*=\s*"(?:16px|1em)"/gi, 'width="1em"'],
    [/width\s*=\s*"(?:32px|2em)"/gi, 'width="2em"'],
    [/\s+/g, " "],
    [/>\s+</g, "><"],
  ],
  POST_RULES = [
    [/&lt;/g, "<"],
    [/&gt;/g, ">"],
    [/&amp;/g, "&"],
    [/&quot;/g, '"'],
    [/[\u27E8\u27E9]/g, (m) => (m === "\u27E8" ? "<" : ">")],
  ],
  normalize = (html) => {
    let cleaned = html;
    RULES.forEach(([re, repl]) => {
      cleaned = cleaned.replace(re, repl);
    });
    cleaned = cleaned.trim();

    let prev;
    do {
      prev = cleaned;
      cleaned = stripMrow(cleaned);
      cleaned = cleaned.replace(/<msqrt><mrow>(.*?)<\/mrow><\/msqrt>/g, "<msqrt>$1</msqrt>");
    } while (cleaned !== prev);

    POST_RULES.forEach(([re, repl]) => {
      cleaned = cleaned.replace(re, repl);
    });

    return cleaned;
  },
  verifyCase = (md, expected) => {
    const our_output = convert(md, compile);
    if (our_output.includes("\n") || our_output.includes("\r")) {
      return [false, "Output contains newlines"];
    }
    const clean_our = our_output.replace(/\u00A0/g, " "),
      clean_exp = expected.replace(/\u00A0/g, " "),
      our_min = normalize(minify(clean_our, { collapseWhitespace: true })),
      expected_min = normalize(minify(clean_exp, { collapseWhitespace: true }));
    if (our_min !== expected_min) {
      return [false, "Expected:\n" + expected_min + "\nGot:\n" + our_min];
    }
    return [true];
  },
  cases = function* () {
    const dir_path = join(import.meta.dirname, "case"),
      files = readdirSync(dir_path);

    for (const file of files) {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        const file_path = join(dir_path, file),
          content = readFileSync(file_path, "utf8"),
          yaml_cases = load(content) || [];
        for (let i = 0; i < yaml_cases.length; ++i) {
          const [md, expected] = yaml_cases[i],
            name = file + " - Case " + i;

          yield {
            name,
            fn: () => {
              const [ok, msg] = verifyCase(md, expected);
              if (!ok) {
                throw new Error(msg);
              }
            },
          };
        }
      }
    }
  };

export default cases;
export { normalize };
