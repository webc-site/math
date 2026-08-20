import BoxX from "../BoxX.js";
import { On } from "../js/On.js";
import { newEl } from "../js/dom.js";
import { langGet, langSet, LANG_LI } from "../js/i18n.js";
import { set } from "./store.js";
import { fetchLang } from "../js/fetchLang.js";
import i18nUrl, { CHOOSE } from "./i18n.js";

const fLang = fetchLang(i18nUrl);

export const LG = " Lg",
  open = () => {
    const BTN = "Btn",
      dialog = BoxX(),
      [main, title, con] = ["main", "h6", "b"].map(newEl),
      cur_lang = langGet() ?? 0;

    main.className = "I18n" + LG;
    On(dialog, {
      close: fLang((i18n) => {
        title.innerText = i18n[CHOOSE];
      }),
    });

    con.append(
      ...LANG_LI.map(([name, id]) => {
        const btn = newEl("button");
        btn.innerText = name;
        btn.className = cur_lang == id ? BTN + " Main" : BTN;
        On(btn, {
          click: () => {
            set(id);
            langSet(id);
            dialog.close();
          },
        });
        return btn;
      }),
    );
    main.append(title, con);
    dialog.append(main);
  };
