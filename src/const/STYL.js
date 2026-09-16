// map 回调运行时拼接公共前缀/渐变线，压缩器折叠不掉，产物里前缀与渐变线只存一份
const LINE = "transparent 47%,currentColor 47%,currentColor 53%,transparent 53%)";

export const [STYLE_BOX, STYLE_CANCEL, STYLE_SOUT] = [
  "border:1px solid;padding:2px 3px",
  "background:linear-gradient(to top right," + LINE,
  "background:linear-gradient(" + LINE,
].map((s) => ' style="display:inline-block;' + s + '"');
