export const split = (str, s) => {
  const p = str.indexOf(s);
  return p >= 0 ? [str.slice(0, p), str.slice(p + 1)] : [str];
};
