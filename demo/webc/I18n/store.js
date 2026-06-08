import CODE from "./CODE.js";
import { split } from "../js/split.js";

const KEY = "lang";

export const get = () => {
    const local = localStorage[KEY];
    if (local !== undefined) return +local;
    const nav = navigator.language,
      idx = CODE.indexOf(nav);
    return idx >= 0 ? idx : Math.max(0, CODE.indexOf(split(nav, "-")[0]));
  },
  set = (id) => {
    localStorage[KEY] = id;
  };
