import { On } from "../js/On.js";
import { D, newEl } from "../js/dom.js";
import { cE } from "../js/cE.js";

(() => {
  const { round, max, min } = Math,
    PART = "part",
    BAR = "bar",
    SI = "si",
    DRAG = "drag",
    PX = "px",
    CLIENT = "client",
    SCROLL = "scroll",
    mk = (tag, part, ...kids) => {
      const e = newEl(tag);
      if (part) e.setAttribute(PART, part);
      e.append(...kids);
      return e;
    },
    mkScroll = (size, pos, axis) => {
      const style_size = size.toLowerCase(),
        style_pos = pos.toLowerCase(),
        client_size = CLIENT + size,
        scroll_size = SCROLL + size,
        scroll_pos = SCROLL + pos,
        client_pos = CLIENT + axis;
      return (ct) => {
        let timer_bar,
          ptr_unbind,
          timer_resize,
          pre_st = -1;
        const m = ct.firstElementChild,
          si = mk("i", SI),
          bar = mk("b", BAR, si),
          getGeo = (sih = si[client_size]) => {
            const ch = ct[client_size],
              sh = m[scroll_size];
            return [sh - ch, max(1, ch - sih - 6), sih, ch, sh];
          },
          updateTop = (h) => {
            if (!bar.parentNode) return;
            const [ds, db] = getGeo(h),
              st = max(0, min(ct[scroll_pos], ds));
            if (pre_st != -1 && pre_st != st) {
              bar.style.opacity = 1;
              clearTimeout(timer_bar);
              timer_bar = setTimeout(() => (bar.style.opacity = 0), 1e3);
            }
            pre_st = st;
            si.style[style_pos] = 3 + round((db * st) / ds) + PX;
          },
          onDown = (e) => {
            if (ptr_unbind) return;
            const bd = D.body;
            bd.setPointerCapture(e.pointerId);
            bd.classList.add(DRAG);
            bar.part.add(DRAG);
            let pre = e[client_pos];
            const detach = () => {
                bd.classList.remove(DRAG);
                bar.part.remove(DRAG);
                un_ptr();
                ptr_unbind = null;
              },
              un_ptr = On(bd, {
                pointermove: (e) => {
                  const [ds, db] = getGeo();
                  ct[scroll_pos] += round((ds * (e[client_pos] - pre)) / db);
                  pre = e[client_pos];
                },
                pointerup: detach,
                lostpointercapture: detach,
              });
            ptr_unbind = detach;
          },
          onClick = (e) => {
            const rect = bar.getBoundingClientRect(),
              top = rect[style_pos],
              [ds, db, sih] = getGeo();
            ct[scroll_pos] = round(ds * max(min((e[client_pos] - top - 3 - sih / 2) / db, 1), 0));
            onDown(e);
          },
          unbind = [
            On(bar, { pointerdown: onClick }),
            On(si, {
              pointerdown: (e) => {
                e.stopPropagation();
                onDown(e);
              },
            }),
            On(ct, { scroll: updateTop.bind(null, undefined) }),
          ],
          ob = new ResizeObserver(() => {
            clearTimeout(timer_resize);
            timer_resize = setTimeout(() => {
              const [, , , ch, sh] = getGeo(),
                is_turn = ch < sh;
              if (is_turn) {
                if (bar.parentNode != ct) ct.appendChild(bar);
                const h = max(16, round((ch * ch) / sh));
                si.style[style_size] = h + PX;
                updateTop(h);
              } else if (bar.parentNode) {
                bar.remove();
              }
            }, 200);
          }),
          destroy = () => {
            clearTimeout(timer_bar);
            clearTimeout(timer_resize);
            unbind.forEach((f) => f());
            if (ptr_unbind) ptr_unbind();
            ob.disconnect();
            if (bar.parentNode) bar.remove();
          };
        bar.style.opacity = 0;
        [ct, m].forEach((i) => ob.observe(i));
        return destroy;
      };
    };

  [
    ["vs", "Height", "Top", "Y", "flex-direction:column;width:100%;min-height:100%"],
    ["hs", "Width", "Left", "X", "min-width:100%;width:max-content;height:100%"],
  ].map(([prefix, size, pos, axis, css]) => {
    const initScroll = mkScroll(size, pos, axis);
    cE(
      prefix,
      class extends HTMLElement {
        connectedCallback() {
          const content = mk("b", "", mk("slot")),
            wrapper = mk("b", SCROLL, content);
          content.style.cssText = "display:flex;" + css;
          this.attachShadow({ mode: "open" }).appendChild(wrapper);
          this._unbind = initScroll(wrapper);
        }
        disconnectedCallback() {
          this._unbind?.();
        }
      },
    );
  });
})();
