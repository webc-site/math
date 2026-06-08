import { On } from "./On.js";

export default (name) => {
  const channel = new BroadcastChannel(name),
    post = (data) => channel.postMessage(data),
    on = (func) => On(channel, { message: (e) => func(e.data) });
  return [post, on];
};
