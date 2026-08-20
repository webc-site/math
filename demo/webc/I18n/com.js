import { On } from "../js/On.js";
import { newEl } from "../js/dom.js";
import { cE } from "../js/cE.js";
import { LG, open } from "./open.js";
import { fetchLang } from "../js/fetchLang.js";
import i18nUrl, { LANG } from "./i18n.js";

const fLang = fetchLang(i18nUrl);

cE(
  "i18n",
  class extends HTMLElement {
    connectedCallback() {
      if (this.firstChild) return;

      const [btn, icon] = ["button", "i"].map(newEl);

      btn.className = "BtnC lang" + LG;
      btn.type = "button";

      this.$ = fLang((i18n) => {
        btn.setAttribute("aria-label", i18n[LANG]);
      });

      icon.className = "Ico";
      btn.append(icon);

      On(btn, {
        click: open,
        keydown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        },
      });

      this.append(btn);
    }

    disconnectedCallback() {
      this.$?.();
    }
  },
);
