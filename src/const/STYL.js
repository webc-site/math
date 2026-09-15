// 公共前缀/渐变线拆为 const 复用，避免重复书写
const PREFIX = ' style="display:inline-block;',
  GRAD = "background:linear-gradient(",
  LINE = "transparent 47%,currentColor 47%,currentColor 53%,transparent 53%)";

export const STYLE_BOX = PREFIX + 'border:1px solid;padding:2px 3px"',
  STYLE_CANCEL = PREFIX + GRAD + "to top right," + LINE + '"',
  STYLE_SOUT = PREFIX + GRAD + LINE + '"';
