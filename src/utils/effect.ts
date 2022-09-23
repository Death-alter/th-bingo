interface EffectOption {
  el: HTMLCanvasElement;
}

class Effect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(option: EffectOption) {
    this.canvas = option.el;
    this.ctx = this.canvas.getContext("2d");
  }
}
