import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { simpleGit } from "simple-git";
import WARN from "@3-/log/WARN.js";
import ERR from "@3-/log/ERR.js";
import CYAN from "@3-/log/CYAN.js";
import GRAY from "@3-/log/GRAY.js";
import ROOT_DIR from "../ROOT.js";

const wrap = (git, name) =>
    new Proxy(git, {
      get: (target, prop) => {
        const orig = target[prop];
        if (typeof orig === "function" && prop !== "then" && prop !== "catch") {
          return async (...args) => {
            const str = args
                .map((x) => (Array.isArray(x) ? JSON.stringify(x) : String(x)))
                .join(" "),
              start = Date.now();
            CYAN("[git:" + name + "] > git " + prop + " " + str);
            try {
              const res = await orig.apply(target, args),
                ms = Date.now() - start;
              GRAY("[git:" + name + "] < " + prop + " success (" + ms + "ms)");
              return res;
            } catch (err) {
              const ms = Date.now() - start;
              ERR("[git:" + name + "] < " + prop + " failed after " + ms + "ms: " + err.message);
              throw err;
            }
          };
        }
        return orig;
      },
    }),
  push = async (git, next_version) => {
    try {
      await git.add("-A");
      await git.commit("v" + next_version);
      await git.push("origin", "dev");
    } catch (err) {
      WARN("Git 提交或推送 dev 分支失败: " + err.message);
    }
  },
  merge = async (git, tmp_dir) => {
    await git.raw("worktree", "prune");
    await git.raw("worktree", "add", tmp_dir, "main");

    const git_tmp = wrap(simpleGit(tmp_dir), "main");
    await git_tmp.fetch("origin", "main");
    await git_tmp.reset(["--hard", "origin/main"]);
    await git_tmp.merge(["dev", "--no-edit"]);
    await git_tmp.push("origin", "main");
  },
  clean = async (git, tmp_dir) => {
    try {
      await git.raw("worktree", "remove", tmp_dir, "--force");
    } catch {
      try {
        rmSync(tmp_dir, { recursive: true, force: true });
      } catch {}
    }
  };

export default async (next_version) => {
  const git = wrap(simpleGit(ROOT_DIR), "dev"),
    tmp_dir = join(tmpdir(), "math-main-worktree-" + Math.random().toString(36).slice(2));

  await push(git, next_version);
  try {
    await merge(git, tmp_dir);
  } finally {
    await clean(git, tmp_dir);
  }
};
