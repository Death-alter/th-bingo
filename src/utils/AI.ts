import Mit from "@/mitt";
import { Spell } from "@/types";
import { local } from "./Storage";

export const enum AIDifficulty {
  // E = 0,
  // N = 1,
  // H = 2,
  L = 3,
}

export const enum AIStatus {
  UNINITIALIZED = 0,
  INITIALIZED = 1,
  WAITING = 2,
  PLAYING = 3,
  PAUSED = 4,
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
  private cdTimer: number = 0;
  private selectedSepllCardIndex = -1;
  private status: AIStatus = AIStatus.UNINITIALIZED;

  private spellCardList: SpellListItem[] = [];

  get weights() {
    const arr = new Array(25);
    let onFiagonal = 99;
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
        onFiagonal = 0;
      }
      if (i !== 0 && i !== 24 && i % 4 === 0) {
        arr[i] += this.diagonalWeight[1];
        onFiagonal = 1;
      }
      if (this.spellCardList[i].status === 1) {
        if (this.rowWeight[rowId] == 30 || this.colWeight[colId] === 30 || this.diagonalWeight[onFiagonal] === 30) {
          arr[i] = 15;
        } else {
          arr[i] -= 5;
        }
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

  init(spellCardList: Spell[], status: number[]) {
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
    this.refreshLineWeights();
    this.timeWeight = this.getTimeWeights();
    this.status = AIStatus.INITIALIZED;
  }

  getLineWeight(status: number[]) {
    let countA = 0;
    let countB = 0;
    for (let i = 0; i < status.length; i++) {
      if (status[i] === 5) ++countA;
      if (status[i] === 7) ++countB;
    }

    if (countA === 0) {
      if (countB === 0) {
        return 0;
      } else if (countB < 3) {
        return 8;
      } else if (countB < 4) {
        return 15;
      } else {
        return 25;
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

  refreshLineWeights() {
    for (let i = 0; i < 5; i++) {
      this.rowWeight[i] = this.getRowWeight(i);
      this.colWeight[i] = this.getColWeight(i);
    }
    this.diagonalWeight[0] = this.getDiagonalWeight(0);
    this.diagonalWeight[1] = this.getDiagonalWeight(1);
  }

  getTimeWeights() {
    const arr: number[] = [];
    for (const item of this.spellCardList) {
      let offset = item.time * 0.12;
      if (offset > 6) offset = 6;
      let time = getNumberInNormalDistribution(item.time + offset * 0.6, offset);
      if (time < item.time) time = item.time;
      arr.push(Math.floor(Math.pow(time * 10, 0.5)));
    }
    return arr;
  }

  gameStart() {
    // if (this.status === AIStatus.UNINITIALIZED) return;
    // this.gameStarted = true;
    // Mit.on("ai_standby_finish", (data: any) => {
    //   this.getSpellCard();
    // });
    // Mit.on("ai_spell_status_change", (data: any) => {
    //   const oldStatus = this.spellCardList[data.index].status;
    //   this.spellCardList[data.index].status = data.status;
    //   this.refreshLineWeights();
    //   if (data.status === 5 && (oldStatus === 2 || oldStatus === 3)) {
    //     this.onSpellCardGrabbed();
    //   }
    // });
    // Mit.on("ai_game_phase", (data: any) => {
    //   this.gamePause();
    // });
    // Mit.on("ai_game_resume", (data: any) => {
    //   this.gameReseum();
    // });
    // Mit.on("ai_game_over", (data: any) => {
    //   this.gameOver();
    // });
    // if (!store.getters.gamePaused) {
    //   setTimeout(() => {
    //     if (this.selectedSepllCardIndex === -1) this.selectSpellCard();
    //     if (GameTime.main > 0) {
    //       this.getSpellCard();
    //     }
    //   }, 1000);
    // }
  }

  gamePause() {
    if (!this.gameStarted) return;
    clearInterval(this.timer);
    this.timer = 0;
    clearInterval(this.cdTimer);
    this.cdTimer = 0;
    this.status = AIStatus.PAUSED;
  }

  async gameReseum() {
    // if (!this.gameStarted) return;
    // const currentSpell = Storage.local.get("ai-current-spell-card");
    // if (currentSpell && currentSpell.index !== -1) {
    //   this.status = AIStatus.PLAYING;
    //   this.selectedSepllCardIndex = currentSpell.index;
    //   this.getSpellCard();
    // } else {
    //   this.status = AIStatus.WAITING;
    //   await this.onGetSpellCardSuccess();
    // }
  }

  gameOver() {
    if (!this.gameStarted) return;
    clearInterval(this.timer);
    this.selectedSepllCardIndex = -1;
    this.timer = 0;
    Mit.off("ai_standby_finish");
    Mit.off("ai_spell_status_change");
    Mit.off("ai_game_phase");
    Mit.off("ai_game_resume");
    Mit.off("ai_game_over");
    this.status = AIStatus.INITIALIZED;
  }

  selectSpellCard() {
    // if (!this.gameStarted) return;
    // let index = -1;
    // let max = -999;
    // for (let i = 0; i < this.weights.length; i++) {
    //   if (!this.weights[i]) continue;
    //   if (max > this.weights[i]) {
    //     continue;
    //   } else if (max === this.weights[i] && Math.random() > 0.5) {
    //     continue;
    //   }
    //   index = i;
    //   max = this.weights[i];
    // }
    // if (this.selectedSepllCardIndex == -1) {
    //   this.selectedSepllCardIndex = index;
    //   store.dispatch("update_spell", { idx: index, status: 3, control_robot: true });
    //   console.log("AI选择符卡" + index);
    // }
  }

  getSpellCard() {
    // if (this.timer !== 0) return;
    // return new Promise((resolve, reject) => {
    //   if (!this.gameStarted || this.selectedSepllCardIndex === -1) return;
    //   const index = this.selectedSepllCardIndex;
    //   const startTime = GameTime.current;
    //   const time = this.spellCardList[index].time;
    //   const currentSpell = Storage.local.get("ai-current-spell-card");
    //   let endTime;
    //   if (currentSpell && currentSpell.index === index) {
    //     endTime = startTime + currentSpell.remainder;
    //   } else {
    //     endTime = startTime + time * 1000;
    //   }
    //   this.status = AIStatus.PLAYING;
    //   this.timer = setInterval(() => {
    //     const currentTime = GameTime.current;
    //     if (currentTime <= endTime) {
    //       const r = Math.random();
    //       const remainder = endTime - currentTime;
    //       console.log(`AI收取符卡中，剩余${Math.floor(remainder / 1000)}秒`);
    //       Storage.local.set("ai-current-spell-card", {
    //         index,
    //         remainder,
    //       });
    //       if (r > getSpellRate[index]) {
    //         clearInterval(this.timer);
    //         this.timer = 0;
    //         reject(index);
    //       }
    //     } else {
    //       clearInterval(this.timer);
    //       this.timer = 0;
    //       store.dispatch("update_spell", { idx: index, status: 7, control_robot: true }).then(() => {
    //         this.spellCardList[index].status = 7;
    //         this.selectedSepllCardIndex = -1;
    //         Storage.local.remove("ai-current-spell-card");
    //         store.commit("set_last_get_time", {
    //           index: 1,
    //           time: GameTime.passed,
    //         });
    //         this.onGetSpellCardSuccess();
    //         resolve(index);
    //       });
    //     }
    //   }, 1000);
    // });
  }

  passSecond() {}

  onFailToGetSpellCard() {
    this.selectSpellCard();
    this.getSpellCard();
  }

  changeCard(index) {
    // const arr = [...store.getters.roomData.change_card_count];
    // if (arr[1] > 0) {
    //   --arr[1];
    //   store.dispatch("update_spell", { idx: this.selectedSepllCardIndex, status: 0, control_robot: true }).then(() => {
    //     clearInterval(this.timer);
    //     this.timer = 0;
    //     this.selectedSepllCardIndex = index;
    //     store.dispatch("update_spell", { idx: index, status: 3, control_robot: true }).then(() => {
    //       this.getSpellCard();
    //     });
    //   });
    //   store.dispatch("change_card_count", {
    //     cnt: arr,
    //   });
    // }
  }

  async onGetSpellCardSuccess() {
    await this.waitForCoolDown();
    this.selectSpellCard();
    this.getSpellCard();
  }

  async waitForCoolDown() {
    // return new Promise((resolve, reject) => {
    //   const cdStartTime = store.getters.gameData.last_get_time[1];
    //   const cdRemainder = store.getters.roomData.room_config.cd_time * 1000 - GameTime.passed + cdStartTime;
    //   this.status = AIStatus.WAITING;
    //   console.log(`AI等待收取cd中，cd为${Math.ceil(cdRemainder / 1000)}秒`);
    //   this.cdTimer = setTimeout(
    //     () => {
    //       console.log("cd结束，AI开始行动");
    //       resolve(null);
    //     },
    //     cdRemainder > 0 ? cdRemainder : 0
    //   );
    // });
  }

  onSpellCardGrabbed() {
    clearInterval(this.timer);
    this.timer = 0;
    this.selectedSepllCardIndex = -1;
    console.log("AI符卡被抢，正在重新选择");
    setTimeout(() => {
      this.selectSpellCard();
      this.getSpellCard();
    }, 1000);
  }
}
