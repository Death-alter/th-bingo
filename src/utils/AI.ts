import store from "@/store/index";

export const enum AIDifficulty {
  E = 0,
  N = 1,
  H = 2,
  L = 3,
  U = 4,
}

export class MaoYu {
  public difficulty: AIDifficulty;
  private multiply: number;

  private get spellCardList() {
    return store.getters.gameData.spells || [];
  }

  constructor(option) {
    this.difficulty = option.difficulty;
    switch (this.difficulty) {
      case AIDifficulty.E:
        this.multiply = 0.6;
      case AIDifficulty.N:
        this.multiply = 0.7;
      case AIDifficulty.H:
        this.multiply = 0.8;
      case AIDifficulty.L:
        this.multiply = 0.9;
      case AIDifficulty.U:
        this.multiply = 1;
    }
  }

  getLineWeights() {}

  getTimeWeights() {}

  getSpellCard(index) {}
}
