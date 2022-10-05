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

export class GridCell {
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

export default class Grid {
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
            grid: this
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