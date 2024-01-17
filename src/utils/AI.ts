import GameTime from "./GameTime";
import mitt from "mitt";
import store from "@/store";
import { SpellCardInfo } from "@/types";

export const enum AIDifficulty {
  // E = 0,
  // N = 1,
  // H = 2,
  L = 3,
}

interface SpellListItem {
  id: number;
  status: number;
  time: number; //收取时间(s)
}

const debugTime = [28, 21, 22, 12, 18, 39, 17, 41, 13, 44, 22, 11, 40, 11, 16, 14, 29, 13, 72, 23, 38, 15, 14, 15, 13];
const getSpellRate = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

export class MaoYu {
  public difficulty: AIDifficulty;
  private multiply: number;
  private rowWeight: number[] = [];
  private colWeight: number[] = [];
  private diagonalWeight: number[] = [];

  private spellCardList: SpellListItem[] = [];

  constructor(option) {
    this.difficulty = option.difficulty;
    switch (this.difficulty) {
      case AIDifficulty.L:
        this.multiply = 1;
    }
  }

  init(spellCardList: SpellCardInfo[], status: number[]) {
    this.spellCardList = [];
    for (let i = 0; i < 25; i++) {
      const item = spellCardList[i];
      this.spellCardList.push({
        id: item.index,
        status: status[i],
        time: debugTime[i],
      });
    }
  }

  banGame() {}

  pickGame() {}

  getlineWeights(lineIndex) {}

  getRowWeights(rowId) {
    const startIndex = rowId * 5;
  }

  getColWeights(colId) {}

  getDiagonalWeights(diagonalId) {}

  getLineWeight(status: number[]) {
    let countA = 0;
    let countB = 0;
    let selectedIndex = -1;
    let k = 0;
    for (let i = 0; i < status.length; i++) {
      switch (status[i]) {
        case 5:
          //对方收取
          countA++;
          break;
        case 7:
          //自己收取
          countB++;
          break;
        case 1:
          //对方选择
          selectedIndex = i;
          break;
      }
    }
    if (countA === 0) {
      k = 100;
    } else if (countA < 2) {
      k = -10;
    } else if (countB === 0) {
      k = 100;
    }

    if (selectedIndex !== -1) {
    }
  }

  getTimeWeights() {
    for (let item of this.spellCardList) {
    }
  }

  selectSpellCard() {}

  getSpellCard(index) {}

  onFailToGetSpellCard() {}

  onSpellCardGrabbed() {}
}
