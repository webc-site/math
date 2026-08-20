#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join } from "node:path";
import pug from "pug";

const PORT = 3000,
  ROOT = join(import.meta.dirname, ".."),
  serveFile = async (req) => {
    const url = new URL(req.url);
    let path_name = url.pathname;
    if (path_name === "/") {
      path_name = "/plugin/index.html";
    }
    if (path_name.endsWith(".html")) {
      const pug_path_name = path_name.slice(0, -5) + ".pug",
        pug_path = join(ROOT, pug_path_name);
      if (existsSync(pug_path)) {
        return new Response(pug.renderFile(pug_path), {
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        });
      }
    }
    const file = Bun.file(join(ROOT, path_name));
    return (await file.exists()) ? new Response(file) : new Response("Not Found", { status: 404 });
  };

Bun.serve({
  port: PORT,
  fetch: serveFile,
});

console.log("Server running at http://localhost:" + PORT);
