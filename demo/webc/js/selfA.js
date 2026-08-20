// 判断A标签的href是否为当前网站的, 如果是, 返回url, 以实现不刷新跳转
export const selfA = (p, e) => {
  if (p.host === location.host) {
    const { hash, pathname, search } = p;
    let url = pathname.slice(1) + search;
    if (hash) {
      url += hash;
    }
    e.preventDefault();
    return url;
  }
};
