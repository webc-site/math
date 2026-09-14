import { cE } from "./js/cE.js";
import compile from "../../lib/mathml.js";
import convert from "../../lib/md.js";

let sheet;

cE(
  "math",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._tex = "";
      this._html = "";
      this._math_w = 0;

      if (!sheet) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(
          ".mathC{font-family:m;width:100%;box-sizing:border-box;color:var(--text-color);line-height:1.6}" +
            ".mathC.single-formula{display:flex;justify-content:center;align-items:center;min-height:100px;font-size:32px;padding:12px 0}" +
            ".mathC.mixed-text{display:block;text-align:center;font-size:18px;padding:8px 0}" +
            "math{display:inline-block !important;transform-origin:center center;font-family:m,t,math,sans-serif;font-weight:normal !important;font-style:normal !important}" +
            "math mo, math mi{font-weight:normal !important;font-style:normal !important}" +
            ".single-formula math{font-size:32px}" +
            ".mixed-text math{font-size:22px;vertical-align:middle;margin:0 6px}" +
            '.mixed-text math[display="block"]{display:block !important;margin:16px auto;font-size:28px}' +
            "c-hs{width:100%;display:block}" +
            ".scroll-wrapper{display:flex;justify-content:center;align-items:center;min-width:100%;width:max-content}",
        );
      }
      this.shadowRoot.adoptedStyleSheets = [sheet];

      this.container = document.createElement("div");
      this.container.className = "mathC";
      this.shadowRoot.appendChild(this.container);

      this._ro = new ResizeObserver(() => this.updateLayout());
    }

    connectedCallback() {
      this._ro.observe(this);
      this.render();
    }

    disconnectedCallback() {
      this._ro.disconnect();
    }

    static get observedAttributes() {
      return ["tex"];
    }

    attributeChangedCallback(name, old_val, new_val) {
      if (name === "tex" && old_val !== new_val) {
        this.render();
      }
    }

    get tex() {
      return this.getAttribute("tex") || "";
    }

    set tex(val) {
      this.setAttribute("tex", val);
    }

    render() {
      const val = this.tex,
        is_single =
          !val.includes("$") ||
          (val.startsWith("$$") && val.endsWith("$$") && val.indexOf("$$", 2) === val.length - 2) ||
          (val.startsWith("$") && val.endsWith("$") && val.indexOf("$", 1) === val.length - 1);

      this.container.className = "mathC " + (is_single ? "single-formula" : "mixed-text");

      let html;
      try {
        if (is_single) {
          let clean_tex = val.trim();
          let is_block = false;
          if (clean_tex.startsWith("$$") && clean_tex.endsWith("$$")) {
            clean_tex = clean_tex.slice(2, -2);
            is_block = true;
          } else if (clean_tex.startsWith("$") && clean_tex.endsWith("$")) {
            clean_tex = clean_tex.slice(1, -1);
          }
          html = compile(clean_tex, is_block);
        } else {
          html = convert(val, compile);
        }
      } catch {
        this.container.textContent = val;
        this._math_w = 0;
        return;
      }

      const temp_div = document.createElement("div");
      temp_div.style.cssText =
        "position:absolute;visibility:hidden;width:max-content;display:inline-block;font-family:m,t,math,sans-serif;font-size:30px;";
      temp_div.innerHTML = html;
      const math_node = temp_div.firstElementChild;
      if (math_node) {
        math_node.style.display = "inline-block";
      }
      document.body.appendChild(temp_div);
      this._math_w = math_node ? math_node.scrollWidth : 0;
      this._html = html;
      document.body.removeChild(temp_div);

      this.updateLayout();
    }

    updateLayout() {
      if (!this._html) return;

      const { paddingLeft, paddingRight } = window.getComputedStyle(this),
        padding_left = parseFloat(paddingLeft) || 0,
        padding_right = parseFloat(paddingRight) || 0,
        max_w = this.clientWidth - padding_left - padding_right;

      if (max_w <= 0) return;

      const math_w = this._math_w;

      if (math_w > 2 * max_w) {
        this.container.innerHTML =
          '<c-hs><div class="scroll-wrapper">' + this._html + "</div></c-hs>";
      } else {
        this.container.innerHTML = this._html;
        const math_el = this.container.querySelector("math");
        if (math_el) {
          if (math_w > max_w) {
            const scale_val = max_w / math_w;
            math_el.style.transform = "scale(" + scale_val + ")";
          } else {
            math_el.style.transform = "none";
          }
        }
      }
    }
  },
);
