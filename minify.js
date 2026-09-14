#!/usr/bin/env bun
import { rolldown } from "rolldown";
import {
  writeFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import Table from "cli-table3";
import ROOT_DIR from "./sh/ROOT.js";

const buildAndMinify = async (src_dir, out_dir, name, external) => {
    const src_file = join(src_dir, name + ".js"),
      out_file = join(out_dir, name + ".js"),
      map_file = join(out_dir, name + ".js.map"),
      bundle = await rolldown({
        input: src_file,
        external: (id) => external.some((dep) => id === dep || id.startsWith(dep + "/")),
      }),
      build_res = await bundle.generate({
        format: "es",
        minify: true,
        sourcemap: true,
        externalLiveBindings: false,
        comments: false,
      }),
      chunk = build_res.output[0];

    await bundle.close();

    const clean_code = chunk.code.replace(/\n\/\/# sourceMappingURL=.*\s*$/, ""),
      map_obj = chunk.map,
      gzip_buf = gzipSync(Buffer.from(clean_code, "utf8")),
      gzip_size = gzip_buf.length;

    writeFileSync(out_file, clean_code, "utf8");
    writeFileSync(map_file, JSON.stringify(map_obj), "utf8");

    return [clean_code.length, gzip_size];
  },
  minify = async (dir = import.meta.dirname) => {
    const pkg_path = join(dir, "package.json"),
      src_dir = join(dir, "src"),
      out_dir = join(dir, "lib");
    let external = [];
    if (existsSync(pkg_path)) {
      try {
        const pkg = JSON.parse(readFileSync(pkg_path, "utf8"));
        external = [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.peerDependencies || {}),
        ];
      } catch {}
    }

    mkdirSync(out_dir, { recursive: true });

    const files = readdirSync(src_dir),
      table = new Table({
        head: ["File", "Minified Size", "Gzipped Size"],
      });

    for (const file of files) {
      if (file.endsWith(".d.ts")) {
        const name = file.slice(0, -5),
          [raw, gz] = await buildAndMinify(src_dir, out_dir, name, external);
        copyFileSync(join(src_dir, file), join(out_dir, file));
        table.push([name + ".js", (raw / 1024).toFixed(3) + " KB", (gz / 1024).toFixed(3) + " KB"]);
      }
    }

    console.log(table.toString());
  };

export default minify;

if (import.meta.main) {
  await minify(process.argv[2] || ROOT_DIR);
}
