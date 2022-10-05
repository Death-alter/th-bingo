import { EffectItem, EffectItemOption } from "../lib/Effect";
import { GridCell } from "../lib/Grid";

export class Flame extends EffectItem {
  constructor(option: EffectItemOption) {
    super(option);
  }
  drawFrame(ctx: CanvasRenderingContext2D, cell: GridCell) {
    
  }
}
