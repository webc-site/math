import { fJson } from "./fetch.js";
import { onLang } from "./i18n.js";

export const fetchLang = (genUrl) => {
  let i18n;
  const hook = new Set();
  onLang(async (code) => {
    i18n = await fJson(genUrl(code));
    for (const f of hook) f(i18n);
  });
  return (refresh) => {
    hook.add(refresh);
    if (i18n) {
      refresh(i18n);
    }
    return () => {
      hook.delete(refresh);
    };
  };
};
