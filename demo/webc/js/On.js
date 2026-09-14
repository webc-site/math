export const On = (elem, dict) => {
  let event, func;
  for (event in dict) {
    func = dict[event];
    elem.addEventListener(event, func);
  }
  return () => {
    for (event in dict) {
      func = dict[event];
      elem.removeEventListener(event, func);
    }
  };
};
