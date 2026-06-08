const STYLE_PREFIX = ' style="display:inline-block;',
  GRAD = "background:linear-gradient(",
  LINE = "transparent 47%,currentColor 47%,currentColor 53%,transparent 53%)";

export const STYLE_BOX = STYLE_PREFIX + 'border:1px solid;padding:2px 3px"',
  STYLE_CANCEL = STYLE_PREFIX + GRAD + "to top right," + LINE + '"',
  STYLE_SOUT = STYLE_PREFIX + GRAD + LINE + '"';
