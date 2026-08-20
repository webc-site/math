import { On } from "../js/On.js";
import { B, newEl } from "../js/dom.js";
import Box from "../Box.js";
import i18nUrl, { CLOSE } from "./i18n.js";
import { fetchLang } from "../js/fetchLang.js";

const fLang = fetchLang(i18nUrl),
  xClose = (dialog) => {
    const x_btn = newEl("a");

    x_btn.className = "aX";
    dialog.prepend(x_btn);
    On(x_btn, { click: () => dialog.close() });
    On(dialog, {
      close: fLang((i18n) => {
        x_btn.title = i18n[CLOSE];
      }),
    });
    return dialog;
  },
  escClose = (dialog) => {
    On(dialog, {
      close: On(B, {
        keyup: (e) => {
          if (27 === e.keyCode) {
            const { target } = e;
            if (["INPUT", "TEXTAREA"].includes(target.tagName)) {
              target.blur();
              return;
            }
            dialog.close();
          }
        },
      }),
    });
    return dialog;
  };

export default () => xClose(escClose(Box()));
