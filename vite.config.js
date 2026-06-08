import { defineConfig } from "vite";
import pug from "pug";
import fs from "fs";
import path from "path";
import { browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import stylus from "@3-/stylus";
import read from "@3-/read";

const svgCache = new Map(),
  scanSvgs = () => {
    svgCache.clear();
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, item.name);
        if (item.isDirectory()) walk(p);
        else if (item.name.endsWith(".svg")) svgCache.set(item.name, p);
      }
    };
    walk(path.resolve("demo"));
  };

scanSvgs();

const inlineSvg = (code, id) => {
  let has_changes = false;
  const clean_id = id.split("?")[0],
    url_re = /url\(\s*(\\?['"])?([^'"\\)]+?\.svg(?:[#?][^'"\\)]*)?)\\?['"]?\s*\)/g,
    new_code = code.replace(url_re, (match, quote = "", rel_path) => {
      const [path_part, hash_part = ""] = rel_path.split(/(?=[#?])/);
      let svg_path = path.resolve(path.dirname(clean_id), path_part);
      if (!fs.existsSync(svg_path)) {
        const cached = svgCache.get(path.basename(path_part));
        if (cached) svg_path = cached;
      }
      if (fs.existsSync(svg_path)) {
        has_changes = true;
        const raw = read(svg_path).trim().replaceAll('"', "'").replace(/\s+/g, " "),
          content =
            "data:image/svg+xml," +
            [..."%#<>,'"].reduce((r, c) => r.replaceAll(c, encodeURIComponent(c)), raw);
        return 'url("' + content + hash_part + '")';
      }
      return match;
    });
  return has_changes ? new_code : code;
};

const cleanup = () => {
  try {
    ["demo/index.html", "demo/style.css"].forEach((f) => {
      const p = path.resolve(f);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    });
  } catch {}
};

const exit = () => {
  cleanup();
  process.exit(0);
};

process.on("exit", cleanup);
process.on("SIGINT", exit);
process.on("SIGTERM", exit);

const compileStyleStyl = () => {
  const styl_path = path.resolve("demo/style.styl"),
    content = read(styl_path),
    compiler = stylus(content, { filename: styl_path }),
    css = compiler.render();
  fs.writeFileSync(path.resolve("demo/style.css"), inlineSvg(css, styl_path));
};

const compilePug = () => {
  const html = pug.renderFile(path.resolve("demo/index.pug"), { pretty: true });
  fs.writeFileSync(path.resolve("demo/index.html"), html);
};

const pugPlugin = () => ({
    name: "vite-plugin-pug-compile",
    buildStart: () => {
      compileStyleStyl();
      compilePug();
    },
    closeBundle: () => {
      cleanup();
    },
    handleHotUpdate: async ({ file, server }) => {
      if (file.endsWith(".pug")) {
        compilePug();
        server.ws.send({ type: "full-reload" });
      } else if (file.endsWith(".styl")) {
        scanSvgs();
        compileStyleStyl();
      }
    },
  }),
  sourcemapHeaderPlugin = () => ({
    name: "vite-plugin-sourcemap-header",
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        const url_path = req.url.split("?")[0].split("#")[0];
        if (url_path.endsWith(".js")) {
          const proj_root = path.resolve(import.meta.dirname);
          let file_path = "";
          if (url_path.startsWith("/@fs/")) {
            file_path = url_path.slice(4);
          } else {
            const file_in_root = path.join(proj_root, url_path),
              file_in_demo = path.join(proj_root, "demo", url_path);
            if (fs.existsSync(file_in_root)) {
              file_path = file_in_root;
            } else if (fs.existsSync(file_in_demo)) {
              file_path = file_in_demo;
            }
          }
          if (file_path && fs.existsSync(file_path + ".map")) {
            res.setHeader("SourceMap", url_path + ".map");
            res.setHeader("X-SourceMap", url_path + ".map");
          }
        }
        next();
      });
    },
  }),
  stylusPlugin = () => ({
    name: "vite-plugin-custom-stylus",
    enforce: "pre",
    resolveId(source, importer) {
      if (source.endsWith(".styl")) {
        const base_dir = importer
            ? path.dirname(importer)
            : path.resolve(import.meta.dirname, "demo"),
          resolved = path.resolve(base_dir, source);
        return resolved + ".css";
      }
      return null;
    },
    load(id) {
      if (id.endsWith(".styl.css")) {
        const styl_path = id.slice(0, -4),
          content = read(styl_path),
          compiler = stylus(content, { filename: styl_path }),
          css = compiler.render();
        if (compiler.deps) {
          compiler.deps().forEach((dep) => this.addWatchFile(dep));
        }
        return inlineSvg(css, styl_path);
      }
      return null;
    },
  });

export default defineConfig({
  root: "demo",
  plugins: [pugPlugin(), sourcemapHeaderPlugin(), stylusPlugin()],
  css: {
    lightningcss: {
      targets: browserslistToTargets(browserslist("> 0.25%, not dead")),
    },
  },
  build: {
    cssMinify: "lightningcss",
  },
  server: {
    port: 9999,
    open: true,
  },
});
