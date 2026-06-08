#!/usr/bin/env bun
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ROOT from "./ROOT.js";

const src_file = join(ROOT, "src", "mathml.js"),
  isSafe = (code) => {
    if (code >= 32 && code <= 126) {
      return code !== 34 && code !== 39 && code !== 92;
    }
    if (code >= 0xa1 && code <= 0xff) {
      return code !== 0xad;
    }
    if (code >= 0x0100 && code < 0xfffe) {
      if (code >= 0x2000 && code <= 0x200f) return false;
      if (code >= 0x2028 && code <= 0x202f) return false;
      if (code >= 0x205f && code <= 0x206f) return false;
      if (code === 0xfeff) return false;
      return true;
    }
    return false;
  },
  unescapeUnicode = (str) =>
    str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      const code = parseInt(hex, 16);
      return isSafe(code) ? String.fromCharCode(code) : match;
    }),
  main = async () => {
    const code = await readFile(src_file, "utf8"),
      unescaped_code = unescapeUnicode(code);
    if (code !== unescaped_code) {
      await writeFile(src_file, unescaped_code, "utf8");
      console.log("Successfully unescaped unicode characters in src/mathml.js");
    } else {
      console.log("No unescaped unicode characters needed in src/mathml.js");
    }
  };

await main();
