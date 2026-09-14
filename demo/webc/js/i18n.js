import bc from "./bc.js";

let ID;

const HOOK = new Set(),
  [post, on] = bc("lang"),
  change = (id) => {
    ID = id;
    for (const f of HOOK) f(id);
  };

export const LANG_LI = [],
  langGet = () => ID,
  onLang = (func) => {
    if (ID !== undefined) func(ID);
    HOOK.add(func);
    return () => {
      HOOK.delete(func);
    };
  },
  langSet = (id) => {
    if (id !== ID) {
      post(id);
      change(id);
    }
  };

on((id) => {
  if (id !== ID) change(id);
});
