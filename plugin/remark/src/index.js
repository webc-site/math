import compile from "@webc.site/math";

const walk = (node) => {
  const { type, children, value } = node;
  if (type === "inlineMath" || type === "math") {
    node.type = "html";
    node.value = compile(value, type === "math");
    delete node.data;
  } else if (children) {
    children.forEach(walk);
  }
};

export default () => walk;
