import { cE } from "./js/cE.js";
import compile from "../../lib/mathml.js";

const parseTex = (val) => {
  let tex = val.trim(),
    block = false;
  if (tex.startsWith("$$") && tex.endsWith("$$")) {
    tex = tex.slice(2, -2);
    block = true;
  } else if (tex.startsWith("$") && tex.endsWith("$")) {
    tex = tex.slice(1, -1);
  }
  return [tex, block];
};

cE(
  "math",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._tex = "";
      this._html = "";
      this._math_w = 0;

      const style = document.createElement("style");
      style.textContent =
        ":host{display:flex !important;justify-content:center;align-items:center;box-sizing:border-box;width:100%}" +
        ".math-container{display:flex;justify-content:center;align-items:center;width:100%;box-sizing:border-box}" +
        "math{display:inline-block !important;transform-origin:center center;color:var(--text-color);font-family:m,t,math,sans-serif;font-size:30px}" +
        "c-hs{width:100%;display:block}" +
        ".scroll-wrapper{display:flex;justify-content:center;align-items:center;min-width:100%;width:max-content}";
      this.shadowRoot.appendChild(style);

      this.container = document.createElement("div");
      this.container.className = "math-container";
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
      const val = this.tex;
      if (!val) {
        this.container.innerHTML = "";
        this._math_w = 0;
        return;
      }

      let [tex, block] = parseTex(val),
        html;
      try {
        html = compile(tex, block);
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
