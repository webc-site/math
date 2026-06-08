const FALSE = ' stretchy="false"',
  space = (l, r) => ' lspace="' + l + 'px" rspace="' + r + 'px"';

export const ATTR_NORMAL = ' mathvariant="normal"',
  ATTR_STRETCHY_FALSE = FALSE,
  ATTR_BAR = FALSE + space(0, 0),
  ATTR_BIN = space(4, 4),
  ATTR_REL = space(5, 5);
