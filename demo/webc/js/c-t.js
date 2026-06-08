import { cE } from "./cE.js";
import { fetchLang } from "./fetchLang.js";

const PENGING = [];

let bind = (me, val) => {
  PENGING.push([me, val]);
};

export const cTranSet = (genUrl) => {
  const fLang = fetchLang(genUrl);
  bind = (me, val) => {
    me.$ = fLang((i18n) => {
      me.textContent = i18n[val];
    });
  };
  while (PENGING.length) {
    bind(...PENGING.pop());
  }
};

cE(
  "t",
  class extends HTMLElement {
    connectedCallback() {
      const val = this.textContent.trim();
      this.textContent = "";
      bind(this, val);
    }

    disconnectedCallback() {
      this.$?.();
    }
  },
);
