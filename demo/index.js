import FORMULAS from "./const/formulas.js";
import LANG_CODES from "./webc/I18n/CODE.js";
import "./webc/Scroll.js";
import "./webc/I18n.js";
import "./webc/Math.js";
import { onLang } from "./webc/js/i18n.js";

let current_translation;

const input = document.getElementById("formula-input"),
  preview = document.getElementById("math-preview"),
  grid = document.getElementById("formulas-grid"),
  adjustHeight = () => {
    const { style, scrollHeight } = input;
    style.height = "auto";
    style.height = scrollHeight + "px";
  },
  renderMath = (val) => {
    preview.setAttribute("tex", val);
  },
  selectFormula = (formula) => {
    input.value = formula;
    renderMath(formula);
    adjustHeight();
    input.focus();
    input.setSelectionRange(formula.length, formula.length);
  },
  i18n_modules = import.meta.glob("./i18n/*.js"),
  loadLang = async (code) => {
    const path = "./i18n/" + code + ".js",
      load = i18n_modules[path] || i18n_modules["./i18n/en.js"],
      mod = await load();
    return mod.default();
  },
  layoutWaterfall = () => {
    const { clientWidth: container_width } = grid,
      gap = 24,
      cards = grid.querySelectorAll(".formula-card");

    let num_cols = 1;
    if (container_width > 968) {
      num_cols = 3;
    } else if (container_width > 600) {
      num_cols = 2;
    }

    const card_width = (container_width - (num_cols - 1) * gap) / num_cols,
      col_heights = Array.from({ length: num_cols }, () => 0);

    cards.forEach((card) => {
      let min_col = 0;
      for (let i = 1; i < num_cols; ++i) {
        if (col_heights[i] < col_heights[min_col]) {
          min_col = i;
        }
      }

      const { style } = card;
      style.width = card_width + "px";
      style.left = min_col * (card_width + gap) + "px";
      style.top = col_heights[min_col] + "px";

      // c-math auto-handles scaling and scrolling

      col_heights[min_col] += card.offsetHeight + gap;
    });

    grid.style.height = Math.max(...col_heights) + "px";
  },
  updateUI = () => {
    const {
        title,
        subtitle,
        formulas_title,
        benchmark_size_title,
        benchmark_size_tip,
        benchmark_speed_title,
        benchmark_speed_tip,
        editor_title,
        editor_tip,
        usage_title,
        source_code,
        editor_placeholder,
        names,
        comment_import,
        comment_compile,
        usage_formula,
      } = current_translation,
      usage_code =
        "// " +
        comment_compile +
        " (@webc.site/math/md.js)\n" +
        "import mdMath from '@webc.site/math/md.js';\n" +
        "import mathml from '@webc.site/math';\n" +
        "const html1 = mdMath('" +
        usage_formula.replace(/\\/g, "\\\\") +
        "', mathml);\n\n" +
        "// " +
        comment_import +
        " (@webc.site/math)\n" +
        "import math from '@webc.site/math';\n" +
        "const html2 = math('e^{i\\\\pi} + 1 = 0', true);";

    [
      ["ui-title", title],
      ["ui-formulas-title", formulas_title],
      ["ui-editor-title", editor_title],
      ["ui-editor-tip", editor_tip],
      ["ui-usage-title", usage_title],
      ["ui-source-link", source_code],
      ["ui-usage-code", usage_code],
      ["ui-benchmark-size-title", benchmark_size_title],
      ["ui-benchmark-size-tip", benchmark_size_tip],
      ["ui-benchmark-speed-title", benchmark_speed_title],
      ["ui-benchmark-speed-tip", benchmark_speed_tip],
    ].forEach(([id, txt]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    });

    const subtitle_el = document.getElementById("ui-subtitle");
    if (subtitle_el) subtitle_el.innerHTML = subtitle;

    input.placeholder = editor_placeholder;

    const cards = FORMULAS.map((formula, idx) => {
      const tex = "$$" + formula + "$$",
        card = document.createElement("div"),
        h3 = document.createElement("h3"),
        code = document.createElement("div"),
        render_box = document.createElement("c-math");

      card.className = "formula-card Lg";
      card.onclick = () => {
        selectFormula(tex);
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      h3.textContent = names[idx] || "Formula " + (idx + 1);

      code.className = "tex-code";
      code.textContent = tex;

      render_box.className = "rendered-math";
      render_box.setAttribute("tex", tex);

      card.append(h3, code, render_box);
      return card;
    });

    grid.innerHTML = "";
    grid.append(...cards);
    ro.disconnect();
    cards.forEach((card) => ro.observe(card));
  },
  init = async () => {
    onLang(async (id) => {
      const code = LANG_CODES[id];
      if (code) {
        current_translation = await loadLang(code);
        updateUI();
        setTimeout(layoutWaterfall, 50);
      }
    });

    input.value = "$$" + FORMULAS[0] + "$$";
    renderMath(input.value);
    adjustHeight();
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
            input.focus();
            obs.disconnect();
          }
        });
      },
      { threshold: 1.0 },
    );
    obs.observe(input);

    input.oninput = () => {
      renderMath(input.value);
      adjustHeight();
    };

    // 字体/MathML 渲染完毕后重新布局
    setTimeout(layoutWaterfall, 50);
    setTimeout(layoutWaterfall, 300);

    window.addEventListener("resize", () => {
      layoutWaterfall();
    });
  };

const ro = new ResizeObserver(() => {
  layoutWaterfall();
});

init();
