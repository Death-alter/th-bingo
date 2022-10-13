<!-- eslint-disable vue/no-parsing-error -->
<template>
  <div class="rule-standard">
    <div class="bingo-wrap">
      <div class="bingo-items">
        <div class="spell-card" v-for="(item, index) in gameData.spells" :key="index">
          <spell-card-cell
            :name="item.name"
            @click="selectSpellCard(index)"
            :selected="selectedSpellIndex === index"
            :status="gameData.status[index]"
          ></spell-card-cell>
        </div>
      </div>
      <bingo-effect class="bingo-effect" />
    </div>
    <div class="count-down-wrap">
      <count-down
        ref="countDown"
        :seconds="countDownSeconds || roomSettings.countDownTime"
        @complete="onCountDownComplete"
        v-show="standbyPhase"
      ></count-down>
    </div>
    <div v-if="isHost">
      <el-button type="primary" @click="start">{{ inGame ? "结 束" : "开 始" }}</el-button>
    </div>
    <div v-if="inGame && !isHost">
      <el-button type="primary" @click="confirmSelect" :disabled="selectedSpellIndex < 0" v-if="!spellCardSelected"
        >选择符卡</el-button
      >
      <el-button type="primary" @click="confirmAttained" v-if="spellCardSelected">确认收取</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, h } from "vue";
import { useStore } from "vuex";
import SpellCardCell from "@/components/spell-card-cell.vue";
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
      winFlag: 0,
    };
  },

  components: {
    SpellCardCell,
    BingoEffect,
    CountDown,
    ElButton,
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
      if (value.start_time) {
        const seconds = this.countDownSeconds - (value.time - value.start_time) / 1000;
        if (seconds > 0) {
          this.standbyPhase = true;
          this.countDownSeconds = Math.ceil(seconds);
        }
      }
      if (value.spells) {
        this.$nextTick(() => {
          this.countDown.start();
        });
      }

      const status = value.status;
      if (status && status.length) {
        if (status.indexOf(0) === -1) {
        }

        for (let i = 0; i < 5; i++) {
          let sumR = 0;
          let sumC = 0;
          for (let j = 0; j < 5; j++) {
            sumR += status[i * 5 + j];
            sumC += status[j * 5 + i];
          }
          if (sumR === 10) {
            this.winFlag = -i;
            return;
          } else if (sumR === 40) {
            this.winFlag = i;
            return;
          }
          if (sumC === 10) {
            this.winFlag = -(i + 5);
            return;
          } else if (sumC === 40) {
            this.winFlag = i + 5;
            return;
          }
        }
        const mainDiagonalSum = status[0] + status[6] + status[12] + status[18] + status[24];
        if (mainDiagonalSum === 10) {
          this.winFlag = -11;
          return;
        } else if (mainDiagonalSum === 40) {
          this.winFlag = 11;
          return;
        }
        const subDiagonalSum = status[4] + status[8] + status[12] + status[16] + status[20];
        if (subDiagonalSum === 10) {
          this.winFlag = -11;
          return;
        } else if (subDiagonalSum === 40) {
          this.winFlag = 11;
          return;
        }
      }
    },
    roomData(value) {
      console.log(value);
      if (!value.started) {
        this.standbyPhase = false;
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
                this.$store.commit("change_game_state");
                this.countDown.reset();
              });
            } else {
              this.$store.dispatch("stop_game", { winner: checked.value }).then(() => {
                this.$store.commit("change_game_state");
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
            this.$store.commit("change_game_state");
            this.standbyPhase = true;
            this.countDown.start();
          });
      }
    },
    onCountDownComplete() {
      this.standbyPhase = false;
    },
    selectSpellCard(index: number) {
      if (!this.spellCardSelected && this.gameData.status[index] === 0) {
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
