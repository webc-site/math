import { toastErr } from "./Toast.js";

const tErr = (url, err) =>
  // 不然会附加到验证码弹出层被关掉
  setTimeout(() =>
    toastErr((el) => (el.textContent = url.slice(url.indexOf("//") + 2) + " " + err)),
  );

export const F = async (url, opt) => {
    let r, status;
    try {
      r = await fetch(url, opt);
      status = r.status;

      if ([200, 0, 301, 304].includes(status)) {
        return r;
      }
    } catch (e) {
      tErr(url, e);
      throw e;
    }

    if (![400, 401, 402, 409, 413, 429].includes(status)) {
      tErr(url, status);
    }

    throw r;
  },
  f = (attr) => async (url, opt) => {
    const r = await F(url, opt);
    return await r[attr]();
  },
  fTxt = f("text"),
  fJson = async (url, opt) => {
    const r = await fTxt(url, opt);
    if (r.length) {
      return JSON.parse(r);
    }
  };

const fab = f("arrayBuffer");
export const fBin = async (url, opt) => new Uint8Array(await fab(url, opt));
