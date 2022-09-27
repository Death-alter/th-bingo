import { Data } from "@/types";

interface EffectOption {
  el: HTMLCanvasElement;
}

export interface EffectItemOption {
  effect: Effect;
}

export class EffectItem {
  private effect: Effect;

  constructor(option: EffectItemOption) {
    this.effect = option.effect;
  }
}

class Effect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number;
  private height: number;
  private effectList: Data<EffectItem> = {};

  constructor(option: EffectOption) {
    this.canvas = option.el;
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
  }

  play(effectName: string) {}

  add(effectItems: Data<EffectItem>) {
    this.effectList = { ...this.effectList, ...effectItems };
  }
}
