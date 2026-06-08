#!/usr/bin/env bun
import { build } from "vite";
import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

await build();

const dir = import.meta.dirname,
  dist_dir = join(dir, "dist");

mkdirSync(join(dist_dir, "webc/I18n"), { recursive: true });
cpSync(join(dir, "webc/I18n/i18n"), join(dist_dir, "webc/I18n/i18n"), { recursive: true });

mkdirSync(join(dist_dir, "webc/BoxX"), { recursive: true });
cpSync(join(dir, "webc/BoxX/i18n"), join(dist_dir, "webc/BoxX/i18n"), { recursive: true });
