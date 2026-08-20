import { langSet, LANG_LI } from "../js/i18n.js";
import NAME from "./NAME.js";
import { get } from "./store.js";

LANG_LI.splice(0, LANG_LI.length, ...NAME.map((name, id) => [name, id]));

langSet(get());
