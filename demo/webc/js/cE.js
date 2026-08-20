export const cE = (name, cls) => {
  name = "c-" + name;
  if (customElements.get(name)) {
    console.log("⚠️ " + name + " 已存在");
    return;
  }
  customElements.define(name, cls);
};
