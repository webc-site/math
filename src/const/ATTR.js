const FALSE = ' stretchy="false"',
  space = (n) => ' lspace="' + n + 'px" rspace="' + n + 'px"',
  mathvar = (v) => ' mathvariant="' + v + '"';

export const ATTR_NORMAL = mathvar("normal"),
  ATTR_BOLD = mathvar("bold"),
  ATTR_DOUBLE_STRUCK = mathvar("double-struck"),
  ATTR_SCRIPT = mathvar("script"),
  ATTR_FRAKTUR = mathvar("fraktur"),
  ATTR_SANSSERIF = mathvar("sans-serif"),
  ATTR_MONOSPACE = mathvar("monospace"),
  ATTR_ITALIC = mathvar("italic"),
  ATTR_BOLD_ITALIC = mathvar("bold-italic"),
  ATTR_STRETCHY_FALSE = FALSE,
  ATTR_BAR = FALSE + space(0),
  ATTR_BIN = space(4),
  ATTR_REL = space(5);
