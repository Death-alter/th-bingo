<!-- eslint-disable vue/no-parsing-error -->
<template>
  <div class="rule-standard">
    <div class="bingo-wrap">
      <right-click-menu style="width: 100%; height: 100%" :menuData="menuData" :disabled="!isHost" @click="onMenuClick">
        <div class="bingo-items">
          <template v-if="gameData.spells">
            <div class="spell-card" v-for="(item, index) in gameData.spells" :key="index">
              <spell-card-cell
                :name="item.name"
                :desc="item.desc"
                @click="selectSpellCard(index)"
                :selected="selectedSpellIndex === index"
                :status="gameData.status[index]"
                :index="index"
              ></spell-card-cell>
            </div>
          </template>
        </div>
      </right-click-menu>
      <div v-if="!inGame || (winFlag !== 0 && !isHost)" class="game-alert">
        <div :style="{ color: alertInfoColor }">{{ alertInfo }}</div>
      </div>
      <bingo-effect class="bingo-effect" />
    </div>
    <div class="count-down-wrap">
      <count-down
        ref="countDown"
        :seconds="countDownSeconds || roomSettings.countDownTime"
        @complete="onCountDownComplete"
        v-show="inGame"
      ></count-down>
    </div>
    <div v-if="isHost">
      <el-button type="primary" @click="start" v-if="winFlag === 0">{{ inGame ? "结束比赛" : "抽取符卡" }}</el-button>
      <el-button type="primary" @click="confirmWinner" v-else
        >确认：{{ winFlag < 0 ? roomData.names[0] : roomData.names[1] }}获胜</el-button
      >
    </div>
    <div v-if="inGame && !isHost">
      <el-button type="primary" @click="confirmSelect" :disabled="selectedSpellIndex < 0" v-if="!spellCardSelected"
        >选择符卡</el-button
      >
      <el-button type="primary" @click="confirmAttained" v-if="spellCardSelected" :disabled="standbyPhase"
        >确认收取</el-button
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, h } from "vue";
import { useStore } from "vuex";
import SpellCardCell from "@/components/spell-card-cell.vue";
import RightClickMenu from "@/components/right-click-menu.vue";
import BingoEffect from "@/components/bingo-effect/index.vue";
import CountDown from "@/components/count-down.vue";
import { ElButton, ElMessageBox, ElRadio, ElRadioGroup } from "element-plus";

export default defineComponent({
  name: "Room",
  data() {
    return {
      paused: true,
      countDownSeconds: 0,
      standbyPhase: false,
      selectedSpellIndex: -1,
      countDownCompleted: false,
      winFlag: 0,
      alertInfo: "等待房主抽取符卡",
      alertInfoColor: "#000",
      menuData: [
        {
          label: "置空",
          value: 0,
        },
        // {
        //   label: "左侧玩家选择",
        //   value: 1,
        // },
        // {
        //   label: "右侧玩家选择",
        //   value: 3,
        // },
        // {
        //   label: "两侧玩家选择",
        //   value: 2,
        // },
        {
          label: "左侧玩家收取",
          value: 5,
        },
        {
          label: "右侧玩家收取",
          value: 7,
        },
      ],
    };
  },

  components: {
    SpellCardCell,
    BingoEffect,
    CountDown,
    ElButton,
    RightClickMenu,
  },
  setup() {
    const store = useStore();
    const countDown = ref();

    return {
      gameData: computed(() => store.getters.gameData),
      roomData: computed(() => store.getters.roomData),
      roomSettings: computed(() => store.getters.roomSettings),
      inRoom: computed(() => store.getters.inRoom),
      isHost: computed(() => store.getters.isHost),
      inGame: computed(() => store.getters.inGame),
      isPlayerA: computed(() => store.getters.isPlayerA),
      isPlayerB: computed(() => store.getters.isPlayerB),
      plyaerASelectedIndex: computed(() => store.getters.plyaerASelectedIndex),
      plyaerBSelectedIndex: computed(() => store.getters.plyaerBSelectedIndex),
      spellCardSelected: computed(() => {
        if (store.getters.isPlayerA) {
          return store.getters.plyaerASelectedIndex !== -1;
        }
        if (store.getters.isPlayerB) {
          return store.getters.plyaerBSelectedIndex !== -1;
        }
        return false;
      }),
      countDown,
    };
  },
  mounted() {
    this.countDownSeconds = this.roomSettings.countDownTime;
  },
  watch: {
    gameData(value) {
      if (value.countdown && value.countdown !== this.countDownSeconds) {
        this.countDownSeconds = value.countdown;
      }
      if (value.start_time && !this.countDownCompleted) {
        const standbyCountDown = this.countDownSeconds - (value.time - value.start_time) / 1000;
        const gameCountDown = value.game_time * 60 - (value.time - value.start_time) / 1000;
        if (standbyCountDown > 0) {
          this.standbyPhase = true;
          this.countDownSeconds = Math.ceil(standbyCountDown);
        } else if (gameCountDown > 0) {
          this.countDownSeconds = Math.ceil(gameCountDown);
        } else {
          this.$store.commit("change_game_state", false);
        }
      }
      if (value.spells) {
        this.$nextTick(() => {
          this.countDown.start();
        });
      }

      const status = value.status;
      if (status && status.length) {
        const available: number[] = new Array(12).fill(2);
        const sumArr: number[] = new Array(12).fill(0);
        this.winFlag = 0;
        let countA = 0;
        let countB = 0;
        status.forEach((item: number, index: number) => {
          const rowIndex = Math.floor(index / 5);
          const columnIndex = index % 5;
          if (item === 5) {
            countA++;
            if (available[rowIndex] > 0) available[rowIndex] -= 2;
            if (available[columnIndex + 5] > 0) available[columnIndex + 5] -= 2;
            sumArr[rowIndex] -= 1;
            sumArr[columnIndex + 5] -= 1;
            if (index % 6 === 0) {
              sumArr[10] -= 1;
              if (available[10] > 0) available[10] -= 2;
            }
            if (index && index % 4 === 0) {
              sumArr[11] -= 1;
              if (available[11] > 0) available[11] -= 2;
            }
          } else if (item === 7) {
            countB++;
            if (available[rowIndex] % 2 === 0) available[rowIndex] -= 1;
            if (available[columnIndex + 5] % 2 === 0) available[columnIndex + 5] -= 1;
            sumArr[rowIndex] += 1;
            sumArr[columnIndex + 5] += 1;
            if (index % 6 === 0) {
              sumArr[10] += 1;
              if (available[10] % 2 === 0) available[10] -= 1;
            }
            if (index && index % 4 === 0) {
              sumArr[11] += 1;
              if (available[11] % 2 === 0) available[11] -= 1;
            }
          }
        });

        for (let i = 0; i < 12; i++) {
          if (sumArr[i] === -5) {
            this.winFlag = -(i + 1);
          } else if (sumArr[i] === 5) {
            this.winFlag = i + 1;
          }
        }

        if (countA >= 13) {
          this.winFlag = -13;
        }
        if (countB >= 13) {
          this.winFlag = 13;
        }
        if (this.winFlag !== 0) {
          this.alertInfo = "已满足胜利条件，等待房主判断";
          this.alertInfoColor = "red";
        }
      }
    },
    roomData(value) {
      if (!value.started) {
        this.alertInfo = "等待房主抽取符卡";
        this.alertInfoColor = "#000";
        this.standbyPhase = false;
      }
      if (value.winner !== undefined) {
        ElMessageBox.alert(`${this.roomData.names[value.winner]}获胜`, "比赛结束", {
          confirmButtonText: "确定",
        });
        delete value.winner;
      }
    },
    inGame(value) {
      if (!value) {
        this.countDownCompleted = false;
        this.countDownSeconds = 0;
      }
    },
  },
  methods: {
    start() {
      if (this.inGame) {
        if (this.winFlag === 0) {
          const checked = ref<boolean | string | number>(-1);
          ElMessageBox({
            title: "还没有人获胜，现在结束比赛请选择一个选项",
            message: () =>
              h(
                ElRadioGroup,
                {
                  modelValue: checked.value,
                  "onUpdate:modelValue": (val: boolean | string | number) => {
                    checked.value = val;
                  },
                },
                () => [
                  h(
                    ElRadio,
                    {
                      label: -1,
                    },
                    {
                      default: () => "结果作废",
                    }
                  ),
                  h(
                    ElRadio,
                    {
                      label: 0,
                    },
                    {
                      default: () => this.roomData.names[0] + "获胜",
                    }
                  ),
                  h(
                    ElRadio,
                    {
                      label: 1,
                    },
                    {
                      default: () => this.roomData.names[1] + "获胜",
                    }
                  ),
                ]
              ),
          }).then(() => {
            //winner
            if (checked.value < 0) {
              this.$store.dispatch("stop_game").then(() => {
                this.countDown.reset();
              });
            } else {
              this.$store.dispatch("stop_game", { winner: checked.value }).then(() => {
                this.countDown.reset();
              });
            }
          });
        }
      } else {
        this.$store
          .dispatch("start_game", {
            game_time: this.roomSettings.gameTimeLimit,
            countdown: this.roomSettings.countDownTime,
            games: this.roomSettings.checkList,
          })
          .then(() => {
            this.$store.commit("change_game_state", true);
            this.standbyPhase = true;
            this.countDown.start();
          });
      }
    },
    onCountDownComplete() {
      this.standbyPhase = false;
      this.countDownCompleted = true;
      this.countDownSeconds = this.gameData.game_time * 60 - this.gameData.countdown;
      this.$nextTick(() => {
        this.countDown.start();
      });
    },
    selectSpellCard(index: number) {
      if (this.selectedSpellIndex === index) {
        this.selectedSpellIndex = -1;
      } else if (!this.spellCardSelected && this.gameData.status[index] === 0) {
        this.selectedSpellIndex = index;
      }
    },
    confirmSelect() {
      if (this.isPlayerA) {
        this.$store.dispatch("update_spell", { idx: this.selectedSpellIndex, status: 1 }).then(() => {
          this.selectedSpellIndex = -1;
        });
      }
      if (this.isPlayerB) {
        this.$store.dispatch("update_spell", { idx: this.selectedSpellIndex, status: 3 }).then(() => {
          this.selectedSpellIndex = -1;
        });
      }
    },
    confirmAttained() {
      if (this.isPlayerA) {
        this.$store.dispatch("update_spell", { idx: this.plyaerASelectedIndex, status: 5 });
      }
      if (this.isPlayerB) {
        this.$store.dispatch("update_spell", { idx: this.plyaerBSelectedIndex, status: 7 });
      }
    },
    confirmWinner() {
      this.$store.dispatch("stop_game", { winner: this.winFlag < 0 ? 0 : 1 }).then(() => {
        this.winFlag = 0;
        this.countDown.reset();
      });
    },
    onMenuClick({ event, target, item }: any) {
      const index = target.getAttribute("index");
      if (index) {
        this.$store.dispatch("update_spell", { idx: target.getAttribute("index"), status: item.value });
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.rule-standard {
  width: 100%;
  height: 100%;
}

.bingo-wrap {
  width: 100%;
  height: 500px;
  box-sizing: border-box;
  position: relative;

  .bingo-items {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-content: space-between;
    border: 1px solid #000;
    border-radius: 4px;
    padding: 2px;
    box-sizing: border-box;

    .spell-card {
      border: 1px solid #000;
      border-radius: 4px;
      width: 19.4%;
      height: 19.4%;
    }
  }

  .game-alert {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    left: 0;
    top: 0;
    background-color: #ffffffcc;
    z-index: 100;
  }
}

.bingo-effect {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 99;
}

.count-down-wrap {
  font-size: 30px;
  margin: 10px 0;
  height: 35px;
}
</style>
