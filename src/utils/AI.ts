import GameTime from "./GameTime";
import Mit from "@/mitt";
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
  level: number;
}

const debugTime = [28, 21, 22, 12, 18, 39, 17, 41, 13, 44, 22, 11, 40, 11, 16, 14, 29, 13, 72, 23, 38, 15, 14, 15, 13];
const getSpellRate = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

function getNumberInNormalDistribution(mean, std_dev) {
  return mean + randomNormalDistribution() * std_dev;
}

function randomNormalDistribution() {
  let u = 0.0,
    v = 0.0,
    w = 0.0,
    c = 0.0;
  do {
    u = Math.random() * 2 - 1.0;
    v = Math.random() * 2 - 1.0;
    w = u * u + v * v;
  } while (w == 0.0 || w >= 1.0);
  c = Math.sqrt((-2 * Math.log(w)) / w);
  return u * c;
}

export class MaoYu {
  public difficulty: AIDifficulty;
  private multiply: number;
  private rowWeight: number[] = []; //每行的权重，共5行
  private colWeight: number[] = []; //每列的权重，共5列
  private diagonalWeight: number[] = []; //对角线的权重
  private timeWeight: number[] = [];
  private gameStarted = false;
  private timer: number = 0;
  private selectedSepllCardIndex = -1;

  private spellCardList: SpellListItem[] = [];

  get weights() {
    const arr = new Array(25);
    for (let i = 0; i < 25; i++) {
      if (this.spellCardList[i].status === 5 || this.spellCardList[i].status === 7) {
        arr[i] = null;
        continue;
      }
      const rowId = Math.floor(i / 5);
      const colId = i % 5;
      arr[i] =
        this.rowWeight[rowId] + this.colWeight[colId] - this.timeWeight[i] + 50 - this.spellCardList[i].level * 5;
      if (i % 6 === 0) {
        arr[i] += this.diagonalWeight[0];
      }
      if (i % 4 === 0) {
        arr[i] += this.diagonalWeight[1];
      }
      if (this.spellCardList[i].status === 1) {
        arr[i] -= 10;
      }
    }
    return arr;
  }

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
        level: item.star,
      });
      if (status[i] === 3) {
        this.selectedSepllCardIndex = i;
      }
    }
    for (let i = 0; i < 5; i++) {
      this.rowWeight[i] = this.getRowWeight(i);
      this.colWeight[i] = this.getColWeight(i);
    }
    this.diagonalWeight[0] = this.getDiagonalWeight(0);
    this.diagonalWeight[1] = this.getDiagonalWeight(1);
    this.timeWeight = this.getTimeWeights();
    console.log(this.rowWeight, this.colWeight, this.diagonalWeight, this.timeWeight);
    console.log(this.weights);
  }

  getLineWeight(status: number[]) {
    let countA = 0;
    let countB = 0;
    for (let i = 0; i < status.length; i++) {
      if (status[i] === 5) ++countA;
      if (status[i] === 7) ++countA;
    }

    if (countA === 0) {
      if (countB === 0) {
        return 0;
      } else if (countB < 4) {
        return 10;
      } else {
        return 30;
      }
    } else if (countA < 3) {
      return -2;
    } else if (countA < 4) {
      return 10;
    } else {
      return 20;
    }
  }

  getRowWeight(rowId) {
    const startIndex = rowId * 5;
    const arr: number[] = [];
    for (let i = startIndex; i < startIndex + 5; i++) {
      arr.push(this.spellCardList[i].status);
    }
    return this.getLineWeight(arr);
  }

  getColWeight(colId) {
    const startIndex = colId;
    const arr: number[] = [];
    for (let i = startIndex; i < startIndex + 21; i += 5) {
      arr.push(this.spellCardList[i].status);
    }
    return this.getLineWeight(arr);
  }

  getDiagonalWeight(diagonalId: number) {
    if (diagonalId === 0) {
      const indexArr = [0, 6, 12, 18, 24];
      return this.getLineWeight(indexArr.map((i) => this.spellCardList[i].status));
    } else if (diagonalId === 1) {
      const indexArr = [4, 8, 12, 16, 20];
      return this.getLineWeight(indexArr.map((i) => this.spellCardList[i].status));
    }
    return 0;
  }

  getTimeWeights() {
    const arr: number[] = [];
    for (let item of this.spellCardList) {
      let offset = item.time * 0.12;
      if (offset > 6) offset = 6;
      let time = getNumberInNormalDistribution(item.time + offset * 0.6, offset);
      if (time < item.time) time = item.time;
      arr.push(Math.floor(Math.pow(time * 10, 0.5)));
    }
    return arr;
  }

  gameStart() {
    this.gameStarted = true;
    this.selectSpellCard();
    this.getSpellCard();
    Mit.on("ai_spell_change", (data: any) => {
      const oldStatus = this.spellCardList[data.index].status;
      this.spellCardList[data.index].status = data.status;
      console.log(oldStatus, data.status);
      if (oldStatus === 3 && data.status === 7) {
        this.onGetSpellCardSuccess();
      }
    });
    Mit.on("ai_game_over", (data: any) => {
      this.gameOver();
    });
  }

  gameOver() {
    clearInterval(this.timer);
    Mit.off("ai_spell_change", (data: any) => {
      this.spellCardList[data.index] = data.status;
    });
    Mit.off("ai_game_over", (data: any) => {
      this.gameOver();
    });
  }

  selectSpellCard() {
    let index = -1;
    let max = -999;

    for (let i = 0; i < this.weights.length; i++) {
      if (!this.weights[i]) continue;
      if (max > this.weights[i]) {
        continue;
      } else if (max === this.weights[i] && Math.random() > 0.5) {
        continue;
      }
      index = i;
      max = this.weights[i];
    }
    if (this.selectedSepllCardIndex !== index) {
      this.selectedSepllCardIndex = index;
      store.dispatch("update_spell", { idx: index, status: 3, control_robot: true });
    }
  }

  getSpellCard() {
    const index = this.selectedSepllCardIndex;
    const startTime = new Date().getTime();
    const time = this.spellCardList[index].time;
    const endTime = startTime + time * 1000;
    this.timer = setInterval(() => {
      const currentTime = new Date().getTime();
      if (currentTime <= endTime) {
        console.log(currentTime);
        const r = Math.random();
        if (r > getSpellRate[index]) {
          clearInterval(this.timer);
          this.timer = 0;
          this.onFailToGetSpellCard();
        }
      } else {
        store.dispatch("update_spell", { idx: index, status: 7, control_robot: true });
        clearInterval(this.timer);
      }
    }, 1000);
  }

  passSecond() {}

  onFailToGetSpellCard() {
    this.getSpellCard();
  }

  changeCard() {}

  onGetSpellCardSuccess() {
    setTimeout(() => {
      this.selectSpellCard();
      this.getSpellCard();
    }, 1000);
  }

  onSpellCardGrabbed() {}
}
