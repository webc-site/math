#!/usr/bin/env bun
import read from "@3-/read";
import write from "@3-/write";
import ERR from "@3-/log/ERR.js";
import styl2nest from "./styl2nest.js";

const files = process.argv.slice(2);
if (files.length === 0) {
  process.exit(0);
}

files.forEach(async (file) => {
  if (file.endsWith(".styl")) {
    try {
      const original = read(file);
      if (original) {
        const formatted = await styl2nest(original, file);
        if (formatted !== original) {
          write(file, formatted);
        }
      }
    } catch (e) {
      ERR("Error formatting " + file + ": " + e.message);
      process.exit(1);
    }
  }
});
