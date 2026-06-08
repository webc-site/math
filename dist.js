#!/usr/bin/env bun
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import rJson from "@3-/read/rJson.js";
import write from "@3-/write";
import WARN from "@3-/log/WARN.js";
import minify from "./minify.js";
import { run as runCompare } from "./sh/bench/pk.js";
import ROOT_DIR from "./sh/ROOT.js";
import gitSync from "./sh/dist/gitSync.js";
import readme from "./sh/dist/readme.js";
import pkgGen from "./sh/github/pkg.js";
import checkLang from "./sh/check.js";
import run from "./test/run.js";
import compareCases from "./test/compare.js";
import { simpleGit } from "simple-git";
import gci from "@3-/gci/lib.js";

const updateRange = (range, version) => {
    const match = range.match(/^([>=^~]+)/),
      prefix = match ? match[0] : "";
    return prefix + version;
  },
  localVersion = (name) => {
    const root_pkg_path = join(ROOT_DIR, "package.json"),
      plugin_dir = join(ROOT_DIR, "plugin");

    if (existsSync(root_pkg_path)) {
      try {
        const root_pkg = rJson(root_pkg_path);
        if (root_pkg.name === name) {
          return root_pkg.version;
        }
      } catch {}
    }
    if (existsSync(plugin_dir)) {
      try {
        for (const dir_name of readdirSync(plugin_dir)) {
          const pkg_path = join(plugin_dir, dir_name, "package.json");
          if (existsSync(pkg_path)) {
            const pkg = rJson(pkg_path);
            if (pkg.name === name) {
              return pkg.version;
            }
          }
        }
      } catch {}
    }
    return null;
  },
  latestVersion = async (name) => {
    try {
      const res = await fetch("https://registry.npmjs.org/" + name + "/latest");
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          return data.version;
        }
      }
    } catch (err) {
      WARN("获取 " + name + " 最新版本失败: " + err.message);
    }
    return localVersion(name);
  },
  main = async () => {
    const git = simpleGit(ROOT_DIR),
      status = await git.status();

    if (status.files.length > 0) {
      const org_argv = process.argv;
      process.argv = org_argv.slice(0, 2);
      try {
        await gci(undefined, ROOT_DIR);
      } finally {
        process.argv = org_argv;
      }
    }

    if (!(await checkLang())) {
      throw new Error("Language check failed");
    }

    const argv = yargs(hideBin(process.argv)).argv,
      target = argv._[0] || ".",
      target_dir = resolve(ROOT_DIR, String(target)),
      pkg_path = join(target_dir, "package.json"),
      pkg = rJson(pkg_path),
      version_parts = pkg.version.split(".");

    version_parts[2] = String(Number(version_parts[2]) + 1);

    const next_version = version_parts.join("."),
      peer = pkg.peerDependencies;

    if (peer) {
      for (const name of Object.keys(peer)) {
        const latest = await latestVersion(name);
        if (latest) {
          peer[name] = updateRange(peer[name], latest);
        }
      }
    }

    pkg.version = next_version;
    write(pkg_path, JSON.stringify(pkg, null, 2) + "\n");

    execSync("bun install", {
      cwd: target_dir,
      stdio: "inherit",
    });

    await readme(target_dir);
    await minify(target_dir);

    if (!(await run("Compare Cases", Array.from(compareCases())))) {
      throw new Error("Compare test failed");
    }

    pkgGen(target_dir);

    if (target_dir === ROOT_DIR) {
      await runCompare();
    }

    await gitSync(next_version);

    console.log("成功为 " + target_dir + " 准备发布文件。版本已提升至: " + next_version);
  };

export default main;

if (import.meta.main) {
  await main();
}
