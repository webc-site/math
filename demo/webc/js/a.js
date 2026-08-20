import { goto } from "./route.js";
import { selfA } from "./selfA.js";
import { B } from "./dom.js";

B.addEventListener("click", (e) => {
  let p = e.target;
  while (p) {
    const { nodeName } = p;
    if (nodeName === "A") {
      const { href } = p;
      if (href) {
        const url = selfA(p, e);
        if (url !== undefined) {
          goto(url);
        } else if (!p.target) {
          p.target = "_blank";
        }
      }
      break;
    } else if (nodeName === "BODY") {
      break;
    }
    p = p.parentNode;
  }
});
