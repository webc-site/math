import { On } from "./On.js";
import { split } from "./split.js";

const HASH = "#";

let pre,
  hooks = [];

export const nowUrl = () => location.pathname.slice(1),
  route = (hook) => {
    hooks.push(hook);
    hook(nowUrl());
    return () => {
      hooks = hooks.filter((f) => f !== hook);
    };
  },
  setPre = (url) => {
    pre = url;
  },
  preUrl = () => pre,
  refresh = (url) => {
    url = url || nowUrl();
    for (const f of hooks) f(url, pre);
    setPre(url);
  },
  removeSlash = (url) => (url[0] === "/" ? url.slice(1) : url),
  setUrl = (url) => {
    url = removeSlash(url);
    if (url !== pre) {
      const [path, hash = ""] = split(url, HASH),
        [p] = split(pre, HASH);
      setPre(url);
      if (path !== p) {
        history.pushState(null, "", "/" + url);
        return 1;
      }
      if (location.hash.slice(1) !== hash) {
        location.hash = hash;
        return;
      }
    }
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  },
  goto = (url) => {
    if (setUrl(url)) refresh(url);
  };

pre = nowUrl();
if (location.hash) pre += location.hash;

On(window, {
  popstate: () => {
    const url = nowUrl();
    if (url !== split(pre, HASH)[0]) refresh(url);
  },
});
