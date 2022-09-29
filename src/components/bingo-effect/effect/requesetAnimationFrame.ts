let lastTime = 0;
const vendors = ["webkit", "moz"];
let render: { (callback: FrameRequestCallback): number } = window.requestAnimationFrame;
let stopRender: { (handler: number): void } = window.cancelAnimationFrame;

//如果window.requestAnimationFrame为undefined先尝试浏览器前缀是否兼容
for (let x = 0; x < vendors.length && !render; ++x) {
  render = window[vendors[x] + "RequestAnimationFrame"];
  stopRender =
    window[vendors[x] + "CancelAnimationFrame"] || //webkit中此取消方法的名字变了
    window[vendors[x] + "CancelRequestAnimationFrame"];
}

//如果仍然不兼容，则使用setTimeOut进行兼容操作
if (!render) {
  render = (callback) => {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
    const id = window.setTimeout(() => {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}

if (!stopRender) {
  stopRender = (id) => {
    clearTimeout(id);
  };
}

export { render, stopRender };
