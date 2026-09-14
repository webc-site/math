import { D, newEl } from "./dom.js";

export const TOAST_TIMEOUT = 1,
  toast = (render, conf_li = []) => {
    const [, timeout = 9] = conf_li.find(([flag]) => flag === TOAST_TIMEOUT) || [],
      el = newEl("b"),
      body = [...D.getElementsByTagName("dialog")].reverse().find((i) => i.open) || D.body;

    body.toast = body.toast || [0];

    el.className = "Toast animated fadeInRight";
    el.style.marginTop = body.toast[0] + "px";

    render(el);

    body.toast.push(el);
    body.appendChild(el);
    body.toast[0] += 14 + el.offsetHeight;

    const closeToast = () => {
      el.classList.add("fadeOutRight");
      setTimeout(() => {
        const idx = body.toast.indexOf(el);
        if (idx > -1) {
          body.toast.splice(idx, 1);
        }
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        body.toast[0] = 0;
        for (const i of body.toast.slice(1)) {
          i.style.marginTop = body.toast[0] + "px";
          body.toast[0] += 14 + i.offsetHeight;
        }
      }, 500);
    };

    el.close = closeToast;

    const x = newEl("i");
    x.className = "x";
    x.onclick = closeToast;
    el.appendChild(x);

    if (timeout) {
      setTimeout(closeToast, timeout * 1000);
    }

    return el;
  },
  toastErr = (render, conf_li = []) => {
    const el = toast(render, conf_li);
    el.classList.add("ERR");
    return el;
  };
