import CODE from "./CODE.js";

export const CHOOSE = "choose",
  LANG = "lang";

export default (lang_id) => "/webc/I18n/i18n/" + CODE[lang_id] + "/js.json";
