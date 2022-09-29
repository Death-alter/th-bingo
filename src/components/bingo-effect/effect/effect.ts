import { Data } from "@/types";
import { render, stopRender } from "./requesetAnimationFrame";

interface EffectOption {
  el: HTMLCanvasElement;
}

export interface EffectItemOption {
  effect: Effect;
  loop?: boolean;
  duration: number;
}

interface GridOption {
  width: number;
  height: number;
  row?: number;
  col?: number;
}

interface GridCellOption {
  x: number;
  y: number;
  grid: Grid;
}

export interface EffectItem {
  [index: string]: any;
  drawFrame: { (ctx: CanvasRenderingContext2D): void };
}

class Grid {
  private row: number = 5;
  private col: number = 5;
  private cellWidth: number;
  private cellHeight: number;
  private cellList: Array<GridCell> = [];

  constructor(option: GridOption) {
    if (option.row) {
      this.row = option.row;
    }
    if (option.col) {
      this.col = option.col;
    }

    this.cellWidth = option.width / this.col;
    this.cellHeight = option.height / this.row;

    for (let j = 0; j < this.row; j++) {
      for (let i = 0; i < this.col; i++) {
        this.cellList.push(
          new GridCell({
            x: this.cellWidth / 2 + i * this.cellWidth,
            y: this.cellHeight / 2 + j * this.cellHeight,
            grid: this,
          })
        );
      }
    }
  }

  getCell(cellNumber: number): GridCell {
    return this.cellList[cellNumber];
  }

  getCellWidth() {
    return this.cellWidth;
  }

  getCellHeight() {
    return this.cellHeight;
  }
}

class GridCell {
  public readonly x: number;
  public readonly y: number;
  private grid: Grid;

  constructor(option: GridCellOption) {
    this.x = option.x;
    this.y = option.y;
    this.grid = option.grid;
  }

  public get width() {
    return this.grid.getCellWidth();
  }

  public get height() {
    return this.grid.getCellHeight();
  }
}

class Effect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  public static effectList: Data<EffectItem> = {};
  private grid: Grid;
  private renderer: number = 0;
  private effectsPlaying: Array<{ name: string; loop: boolean }> = [];

  constructor(option: EffectOption) {
    this.canvas = option.el;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.grid = new Grid({ width: this.width, height: this.height });
  }

  play(effectName: string, loop = true) {}

  pause() {}

  stop() {}

  render() {
    this.renderer = render(() => {
      if (this.effectsPlaying.length) {
        this.effectsPlaying.forEach((item, index) => {
          Effect.effectList[item.name].drawFrame(this.ctx);
          if (!item.loop) {
          }
        });
        this.render();
      }
    });
  }

  stopRender() {
    stopRender(this.renderer);
  }

  in(cellNumber: number) {
    return this;
  }

  static add(effectItems: Data<EffectItem>) {
    Effect.effectList = { ...Effect.effectList, ...effectItems };
  }
}

export default Effect;
