import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import ERR from "@3-/log/ERR.js";
import ROOT from "./ROOT.js";

const WEBC_SITE_DIR = path.join(ROOT, "..", "webc.site"),
  MATH_DIR = ROOT,
  compile = (srcRel, destRel) => {
    const srcDir = path.join(WEBC_SITE_DIR, srcRel),
      destDir = path.join(MATH_DIR, destRel);

    if (!fs.existsSync(srcDir)) {
      ERR("Source directory not found: " + srcDir);
      return;
    }

    // Find all js.yml files in subdirectories
    const langs = fs.readdirSync(srcDir);
    for (const lang of langs) {
      const langSrcDir = path.join(srcDir, lang);
      if (fs.statSync(langSrcDir).isDirectory()) {
        const ymlFile = path.join(langSrcDir, "js.yml");
        if (fs.existsSync(ymlFile)) {
          try {
            const ymlContent = fs.readFileSync(ymlFile, "utf8"),
              jsonContent = yaml.load(ymlContent),
              langDestDir = path.join(destDir, lang);
            fs.mkdirSync(langDestDir, { recursive: true });
            fs.writeFileSync(path.join(langDestDir, "js.json"), JSON.stringify(jsonContent));
          } catch (e) {
            ERR("Failed to compile " + ymlFile + ":", e);
          }
        }
      }
    }
    console.log("Compiled translations from " + srcRel + " to " + destRel);
  };

compile("ui/webc/I18n/i18n", "demo/webc/I18n/i18n");
compile("ui/webc/BoxX/i18n", "demo/webc/BoxX/i18n");
