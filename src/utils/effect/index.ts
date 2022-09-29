import { Data } from "@/types";

interface EffectOption {
  el: HTMLCanvasElement;
}

export interface EffectItemOption {
  effect: Effect;
}

interface GridOption {
  width: number;
  height: number;
  row?: number;
  col?: number;
}

interface GridCellOption {
  width: number;
  height: number;
  x: number;
  y: number;
}

export class EffectItem {
  private effect: Effect;

  constructor(option: EffectItemOption) {
    this.effect = option.effect;
  }
}

class Grid {
  private row: number = 5;
  private col: number = 5;
  private cellList: Array<GridCell> = [];

  constructor(option: GridOption) {
    if (option.row) {
      this.row = option.row;
    }
    if (option.col) {
      this.col = option.col;
    }

    const cellWidth = option.width / this.col;
    const cellHeight = option.height / this.row;

    for (let j = 0; j < this.row; j++) {
      for (let i = 0; i < this.col; i++) {
        this.cellList.push(
          new GridCell({
            x: cellWidth / 2 + i * cellWidth,
            y: cellHeight / 2 + j * cellHeight,
            width: cellWidth,
            height: cellHeight,
          })
        );
      }
    }
  }

  getCell(cellNumber: number): GridCell {
    return this.cellList[cellNumber];
  }
}

class GridCell {
  public readonly x: number;
  public readonly y: number;
  public readonly width: number;
  public readonly height: number;

  constructor(option: GridCellOption) {
    this.x = option.x;
    this.y = option.y;
    this.width = option.width;
    this.height = option.height;
  }
}

class Effect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number;
  private height: number;
  private effectList: Data<EffectItem> = {};
  private grid: Grid;

  constructor(option: EffectOption) {
    this.canvas = option.el;
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.grid = new Grid({ width: this.width, height: this.height });
  }

  play(effectName: string) {}

  add(effectItems: Data<EffectItem>) {
    this.effectList = { ...this.effectList, ...effectItems };
  }
}
