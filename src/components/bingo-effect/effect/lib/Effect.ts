import { Data } from "@/types";
import Grid, { GridCell } from "./Grid";
import Renderer from "./Renderer";
import { Constructor } from "@/types";

interface EffectOption {
  el: HTMLCanvasElement;
}

export interface EffectItemOption {
  loop?: boolean;
  duration: number;
}

export class EffectItem {
  private loop: boolean = true;

  constructor(option: EffectItemOption) {
    if (option.loop !== undefined) {
      this.loop = !!option.loop;
    }
  }

  drawFrame(ctx: CanvasRenderingContext2D, cell: GridCell): void {}
}

export class Effect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  public static effectList: Data<Constructor<EffectItem>> = {};
  private effectsPlaying: Array<{ name: string; loop: boolean }> = [];
  public grid: Grid;
  public renderer: Renderer;

  constructor(option: EffectOption) {
    this.canvas = option.el;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.grid = new Grid({
      width: this.width,
      height: this.height
    });
    this.renderer = new Renderer({ effect: this });
  }

  getContext() {
    return this.ctx;
  }

  play(effectName: string, gridIndex: number) {
    this.renderer.render(new Effect.effectList[effectName]({}), gridIndex);
  }

  pause() {}

  stop() {}

  in(cellNumber: number) {
    return this;
  }

  static add(name: string, effectItem: any) {
    Effect.effectList[name] = effectItem;
  }
}

export default Effect;
