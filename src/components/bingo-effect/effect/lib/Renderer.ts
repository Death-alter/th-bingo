import Effect, { EffectItem } from "./Effect";
import { Constructor } from "@/types";
import { GridCell } from "./Grid";

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
if (!render || !stopRender) {
  render = (callback) => {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
    const id = window.setTimeout(() => {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
  stopRender = (id) => {
    clearTimeout(id);
  };
}

interface RendererOption {
  effect: Effect;
}

interface RenderingItem {
  cell: GridCell;
  effect: EffectItem;
}

export default class Renderer {
  private effect: Effect;
  private ctx: CanvasRenderingContext2D;
  private renderList: Array<RenderingItem> = [];
  private rendering: boolean = false;
  private renderTimer: number = 0;

  constructor(option: RendererOption) {
    this.effect = option.effect;
    this.ctx = this.effect.getContext();
  }

  render(effectItem: EffectItem, gridIndex: number) {
    this.renderList.push({ effect: effectItem, cell: this.effect.grid.getCell(gridIndex) });
    if (this.renderList.length > 0) {
      if (!this.rendering) {
        this.renderTimer = render(() => {
          for (const item of this.renderList) {
            item.effect.drawFrame(this.ctx, item.cell);
          }
        });
      } else {
        stopRender(this.renderTimer);
      }
    }
  }

  stopRender() {}
}
