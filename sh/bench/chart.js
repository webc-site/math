import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { optimize } from "svgo";
import { ROOT } from "./util.js";

export const generate = (filename, data, is_sqrt_scale, ratio_suffix) => {
  const values = data.map((d) => d.value),
    max_val = Math.max(...values),
    svg_width = 400,
    svg_height = 260,
    baseline_y = 200,
    max_h = 150; // slightly reduced to give room for 3D top face

  let svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    svg_width +
    " " +
    svg_height +
    '" width="100%">\n' +
    "  <defs>\n" +
    '    <linearGradient id="our-grad-front" x1="0%" y1="100%" x2="0%" y2="0%">\n' +
    '      <stop offset="0%" stop-color="#ff7e40" />\n' +
    '      <stop offset="100%" stop-color="#ff2e93" />\n' +
    "    </linearGradient>\n" +
    '    <linearGradient id="our-grad-side" x1="0%" y1="100%" x2="0%" y2="0%">\n' +
    '      <stop offset="0%" stop-color="#d9541a" />\n' +
    '      <stop offset="100%" stop-color="#d91672" />\n' +
    "    </linearGradient>\n" +
    '    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">\n' +
    '      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#ff5e00" flood-opacity="0.25" />\n' +
    "    </filter>\n" +
    "  </defs>\n\n" +
    "  <!-- Background Grid -->\n" +
    '  <line x1="30" y1="40" x2="370" y2="40" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4,4" />\n' +
    '  <line x1="30" y1="120" x2="370" y2="120" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4,4" />\n\n';

  data.forEach(({ name, version, value, label, ratio, is_ours }, idx) => {
    const clean_ratio = ratio.replace(" ⭐️", ""),
      h = Math.max(
        10,
        Math.round(
          (is_sqrt_scale ? Math.sqrt(value) / Math.sqrt(max_val) : value / max_val) * max_h,
        ),
      ),
      x = 60 + idx * 115,
      center_x = x + 25,
      y = baseline_y - h,
      // 3D parameters
      dx = 8,
      dy = 6,
      w = 36,
      x_front = center_x - 22,
      // Color assignment
      front_fill = is_ours ? "url(#our-grad-front)" : idx === 1 ? "#cbd5e1" : "#94a3b8",
      side_fill = is_ours ? "url(#our-grad-side)" : idx === 1 ? "#94a3b8" : "#64748b",
      top_fill = is_ours ? "#ff9d66" : idx === 1 ? "#e2e8f0" : "#cbd5e1",
      text_color = is_ours ? "#ff3e00" : "#475569",
      font_weight = is_ours ? "700" : "600",
      label_color = is_ours ? "#ff3e00" : "#64748b";

    svg += "  <!-- Column " + (idx + 1) + ": " + name + " -->\n";

    // 1. Top Cap (3D)
    svg +=
      '  <polygon points="' +
      x_front +
      "," +
      y +
      " " +
      (x_front + dx) +
      "," +
      (y - dy) +
      " " +
      (x_front + w + dx) +
      "," +
      (y - dy) +
      " " +
      (x_front + w) +
      "," +
      y +
      '" fill="' +
      top_fill +
      '" />\n';

    // 2. Side Shadow (3D)
    svg +=
      '  <polygon points="' +
      (x_front + w) +
      "," +
      y +
      " " +
      (x_front + w + dx) +
      "," +
      (y - dy) +
      " " +
      (x_front + w + dx) +
      "," +
      (baseline_y - dy) +
      " " +
      (x_front + w) +
      "," +
      baseline_y +
      '" fill="' +
      side_fill +
      '" />\n';

    // 3. Front Face (3D)
    svg +=
      '  <rect x="' +
      x_front +
      '" y="' +
      y +
      '" width="' +
      w +
      '" height="' +
      h +
      '" fill="' +
      front_fill +
      '"' +
      (is_ours ? ' filter="url(#glow)"' : "") +
      " />\n";

    // 4. Star or Ratio above
    if (is_ours) {
      svg +=
        '  <path d="M6,0.3 L7.9,4.1 L12.1,4.7 L9.1,7.7 L9.8,11.9 L6,9.9 L2.2,11.9 L2.9,7.7 L0,4.7 L4.1,4.1 Z" transform="translate(' +
        (center_x - 6) +
        ", " +
        (y - 20) +
        ')" fill="#ff3e00" />\n';
    } else {
      svg +=
        '  <text x="' +
        center_x +
        '" y="' +
        (y - 12) +
        '" font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" font-size="11" font-weight="700" fill="#64748b" text-anchor="middle">' +
        clean_ratio +
        ratio_suffix +
        "</text>\n";
    }

    // 5. Value Label
    svg +=
      '  <text x="' +
      center_x +
      '" y="' +
      (y - 28) +
      '" font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" font-size="12" font-weight="' +
      font_weight +
      '" fill="' +
      label_color +
      '" text-anchor="middle">' +
      label +
      "</text>\n";

    // 6. Name (Line 1)
    svg +=
      '  <text x="' +
      center_x +
      '" y="222" font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" font-size="13" font-weight="' +
      font_weight +
      '" fill="' +
      text_color +
      '" text-anchor="middle">' +
      name +
      "</text>\n";

    // 7. Version (Line 2)
    if (version) {
      svg +=
        '  <text x="' +
        center_x +
        '" y="238" font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" text-anchor="middle">' +
        version +
        "</text>\n\n";
    } else {
      svg += "\n";
    }
  });

  svg += "\n</svg>";
  const optimized = optimize(svg, { multipass: true });
  writeFileSync(join(ROOT, "demo", filename), optimized.data, "utf8");
  return "demo/" + filename;
};
