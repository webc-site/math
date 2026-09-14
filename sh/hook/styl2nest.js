import { existsSync } from "node:fs";
import { load as loadYaml } from "js-yaml";
import { join } from "node:path";
import read from "@3-/read";

const ROOT = join(import.meta.dirname, "..", ".."),
  loadSupremacyOptions = () => {
    const yml_path = join(ROOT, "supremacy.yml");
    if (existsSync(yml_path)) {
      const yml = read(yml_path);
      if (yml) {
        return loadYaml(yml);
      }
    }
    return {};
  };

export default async (content) => {
  try {
    const stylfmt = (await import("@3-/stylfmt")).default,
      supremacy_options = loadSupremacyOptions();
    return stylfmt(supremacy_options)(content);
  } catch {
    return content;
  }
};
