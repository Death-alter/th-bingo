<!-- eslint-disable vue/no-parsing-error -->
<template>
  <div class="rule-standard">
    <el-row>
      <el-col :span="4">
        <div class="player-extra-info" v-if="roomData.started">
          <div class="spell-card-score">
            <div class="spell-card-score-number">
              <div class="spell-card-score-number-info">{{ playerAScore }}</div>
            </div>
            <div class="spell-card-score-text">得分</div>
          </div>
        </div>
      </el-col>
      <el-col :span="16">
        <div class="bingo-wrap">
          <right-click-menu
            style="width: 100%; height: 100%"
            :menuData="menuData"
            :disabled="!isHost"
            @click="onMenuClick"
          >
            <div class="bingo-items">
              <template v-if="gameData.spells">
                <div class="spell-card" v-for="(item, index) in gameData.spells" :key="index">
                  <spell-card-cell
                    :name="item.name"
                    :desc="item.desc"
                    :level="item.star"
                    @click="selectSpellCard(index)"
                    :selected="availableIndexList.indexOf(index) !== -1"
                    :disabled="availableIndexList.indexOf(index) === -1"
                    :status="gameData.status[index] < 4 ? 0 : gameData.status[index]"
                    :index="index"
                  ></spell-card-cell>
                </div>
              </template>
            </div>
          </right-click-menu>
          <div v-if="!inGame || ((winFlag !== 0 || gamePaused) && !isHost)" class="game-alert">
            <div :style="{ color: alertInfoColor }">{{ alertInfo }}</div>
          </div>
          <bingo-link-effect class="bingo-effect" :route-a="routeA" :route-b="routeB" />
        </div>
        <div class="count-down-wrap">
          <count-down
            ref="countDown"
            :seconds="countDownSeconds || roomSettings.countDownTime"
            @complete="onCountDownComplete"
            v-show="inGame"
          ></count-down>
        </div>
        <div v-if="isHost" class="host-buttons">
          <el-button size="small" @click="resetRoom" :disabled="inGame">重置房间</el-button>
          <el-button type="primary" @click="start" v-if="winFlag === 0">{{
            inGame ? "结束比赛" : "抽取符卡"
          }}</el-button>
          <el-button type="primary" @click="confirmWinner" v-else
            >确认：{{ winFlag < 0 ? roomData.names[0] : roomData.names[1] }}获胜</el-button
          >
          <el-button size="small" @click="pause" :disabled="gamePhase !== 2">{{
            gamePaused ? "继续比赛" : "暂停比赛"
          }}</el-button>
        </div>
        <div v-if="inGame && !isHost">
          <el-button
            type="primary"
            @click="confirmSelect"
            :disabled="gamePaused || !routeComplete"
            v-if="(gamePhase === 1 || !confirmed) && !(gamePhase > 1 && routeComplete)"
            >{{ confirmed ? "取消确认" : "确认路线" }}</el-button
          >
        </div>
        <div class="audio">
          <audio ref="turn1CountdownAudio" :src="require('@/assets/audio/turn1_countdown.mp3')"></audio>
          <audio ref="turn3CountdownAudio" :src="require('@/assets/audio/turn3_countdown.mp3')"></audio>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="player-extra-info" v-if="roomData.started">
          <div class="spell-card-score">
            <div class="spell-card-score-number">
              <div class="spell-card-score-number-info">{{ playerBScore }}</div>
            </div>
            <div class="spell-card-score-text">得分</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, h, getCurrentInstance, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import SpellCardCell from "@/components/spell-card-cell.vue";
import RightClickMenu from "@/components/right-click-menu.vue";
import BingoLinkEffect from "@/components/bingo-effect/link.vue";
import CountDown from "@/components/count-down.vue";
import { ElButton, ElMessageBox, ElRadio, ElRadioGroup, ElRow, ElCol } from "element-plus";
import { Minus, Plus } from "@element-plus/icons-vue";

export default defineComponent({
  name: "Room",
  data() {
    return {
      countDownSeconds: 0,
      availableIndexList: [] as number[],
      confirmed: false,
      gamePhase: 0,
      playerAScore: 0,
      playerBScore: 0,
      routeA: [0],
      routeB: [4],
      winFlag: 0,
      audioPlaying: false,
      alertInfo: "等待房主抽取符卡",
      alertInfoColor: "#000",
      cardCount: [2, 2],
      menuData: [
        {
          label: "置空",
          value: 0,
        },
        {
          label: "两侧玩家收取",
          value: 6,
        },
        {
          label: "左侧玩家收取",
          value: 5,
          tag: "playerA",
        },
        {
          label: "右侧玩家收取",
          value: 7,
          tag: "playerB",
        },
      ],
    };
  },

  components: {
    SpellCardCell,
    BingoLinkEffect,
    CountDown,
    ElButton,
    RightClickMenu,
    ElRow,
    ElCol,
  },
  setup() {
    const store = useStore();
    const countDown = ref();
    const turn1CountdownAudio = ref();
    const turn3CountdownAudio = ref();
    const { proxy }: any = getCurrentInstance();

    onMounted(() => {
      proxy.$bus.on("A_link_change", (index: number) => {
        console.log(proxy.isHost, proxy.gamePhase);
        if (proxy.isHost || proxy.gamePhase > 1) {
          proxy.link("A", index);
        }
      });
      proxy.$bus.on("B_link_change", (index: number) => {
        if (proxy.isHost || proxy.gamePhase > 1) {
          proxy.link("B", index);
        }
      });
    });
    onUnmounted(() => {
      proxy.$bus.off("A_link_change");
      proxy.$bus.off("B_link_change");
    });

    return {
      gameData: computed(() => store.getters.gameData),
      roomData: computed(() => store.getters.roomData),
      roomSettings: computed(() => store.getters.roomSettings),
      inRoom: computed(() => store.getters.inRoom),
      isHost: computed(() => store.getters.isHost),
      inGame: computed(() => store.getters.inGame),
      gamePaused: computed(() => store.getters.gamePaused),
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
      routeComplete: computed(() => {
        if (store.getters.isPlayerA) {
          return proxy.routeA[proxy.routeA.length - 1] === 24;
        }
        if (store.getters.isPlayerB) {
          return proxy.routeB[proxy.routeB.length - 1] === 20;
        }
        return false;
      }),
      countDown,
      turn1CountdownAudio,
      turn3CountdownAudio,
      Minus,
      Plus,
    };
  },
  mounted() {
    this.countDownSeconds = this.roomSettings.countDownTime;
    if (!this.isHost) {
      this.getAvailableIndexList();
    }
  },
  watch: {
    gameData(value) {
      if (value.start_time) {
        const currentTime = new Date().getTime();
        const startTime = value.start_time;

        let pasedTime;
        pasedTime = (currentTime - startTime) / 1000;
        const standbyCountDown = value.countdown - pasedTime;
        const gameCountDown = value.game_time * 60 - pasedTime;
        if (standbyCountDown > 0) {
          this.gamePhase = 1;
          this.countDownSeconds = Math.ceil(standbyCountDown);
          if (this.gameData.need_win === 2 && !this.audioPlaying) {
            const gameIndex = this.roomData.score[0] + this.roomData.score[1] + 1;
            switch (gameIndex) {
              case 1:
                this.turn1CountdownAudio.currentTime = pasedTime;
                this.turn1CountdownAudio.play();
                this.audioPlaying = true;
                break;
              case 3:
                this.turn3CountdownAudio.currentTime = pasedTime + 2;
                this.turn3CountdownAudio.play();
                this.audioPlaying = true;
                break;
            }
          }
          this.$nextTick(() => {
            this.countDown.start();
          });
        } else if (gameCountDown > 0) {
          this.gamePhase = 2;
          this.countDownSeconds = Math.ceil(gameCountDown);
          if (!value.pause_begin_ms) {
            this.$nextTick(() => {
              this.countDown.start();
            });
          }
        }
      } else {
        this.$store.commit("change_game_state", false);
        this.routeA = [];
        this.routeB = [];
        this.availableIndexList = [];
      }

      if (value.link_data) {
        if (value.link_data.link_idx_a && !(this.isPlayerB && this.gamePhase === 1)) {
          this.routeA = value.link_data.link_idx_a;
        }
        if (value.link_data.link_idx_b && !(this.isPlayerA && this.gamePhase === 1)) {
          this.routeB = value.link_data.link_idx_b;
        }
        if (this.routeComplete && this.gamePhase > 1) {
          this.confirmed = true;
          this.availableIndexList = [];
        } else {
          this.getAvailableIndexList();
        }
        value.link_data = {};
      } else {
        this.routeA = [0];
        this.routeB = [4];
        this.getAvailableIndexList();
      }

      const status = value.status;
      if (status && status.length) {
        // if (this.winFlag !== 0) {
        //   this.alertInfo = "已满足胜利条件，等待房主判断";
        //   this.alertInfoColor = "red";
        // }
      }
    },
    roomData(value) {
      if (!value.started) {
        this.alertInfo = "等待房主抽取符卡";
        this.alertInfoColor = "#000";
        this.gamePhase = 0;
        this.routeA = [];
        this.routeB = [];
        this.availableIndexList = [];
      }
      if (value.winner !== undefined) {
        ElMessageBox.alert(`${this.roomData.names[value.winner]}获胜`, "比赛结束", {
          confirmButtonText: "确定",
        });
        delete value.winner;
      }
      this.cardCount = value.change_card_count;
    },
    inGame(value) {
      if (!value) {
        this.gamePhase = 0;
        this.countDownSeconds = 0;
        this.stopBGM();
      }
    },
    gamePaused(value) {
      if (value) {
        this.alertInfo = "游戏已暂停";
        this.alertInfoColor = "#000";
        this.countDown.pause();
      } else {
        this.countDown.start();
      }
    },
    routeComplete(value) {
      if (value && this.gamePhase > 1) {
        this.availableIndexList = [];
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
              this.$store.dispatch("stop_game", { winner: -1 }).then(() => {
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
            ranks: this.roomSettings.difficultyList,
            need_win: (this.roomSettings.format + 1) / 2,
          })
          .then(() => {
            this.$store.dispatch("change_card_count", {
              cnt: [this.roomSettings.playerA.changeCardCount, this.roomSettings.playerB.changeCardCount],
            });
            this.$store.commit("change_game_state", true);
            this.gamePhase = 1;
            this.countDown.start();
          });
      }
    },
    pause() {
      if (this.gamePaused) {
        this.$store.dispatch("modify_link_time_data", { whose: this.gamePhase > 2 ? 1 : 0, start: false });
      } else {
        this.$store.dispatch("modify_link_time_data", { whose: this.gamePhase > 2 ? 1 : 0, start: true });
      }
    },
    onCountDownComplete() {
      if (this.gamePhase === 1) {
        this.gamePhase = 2;
        this.countDownSeconds = this.gameData.game_time * 60 - this.gameData.countdown;
        this.stopBGM();
        if (this.routeComplete) {
          this.availableIndexList = [];
          this.confirmed = true;
        }
        this.$nextTick(() => {
          this.countDown.start();
        });
      } else if (this.gamePhase === 2) {
        this.gamePhase = 0;
      }
    },
    selectSpellCard(index: number) {
      let tag: string;
      if (this.isPlayerA) {
        tag = "A";
      } else if (this.isPlayerB) {
        tag = "B";
      } else {
        tag = "";
        return;
      }
      let status;
      const linkList = this["route" + tag];
      if (index === linkList[linkList.length - 1]) {
        status = 0;
      } else {
        status = this.isPlayerA ? 1 : 3;
      }
      this.$store.dispatch("update_spell", { idx: index, status }).then(() => {
        this.link(tag, index);
      });
    },
    confirmSelect() {
      if (!this.confirmed) {
        this.availableIndexList = [];
        this.confirmed = true;
      } else {
        this.getAvailableIndexList();
        this.confirmed = false;
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
      if (index !== null) {
        this.$store.dispatch("update_spell", { idx: parseInt(index), status: item.value });
      }
    },
    stopBGM() {
      this.turn1CountdownAudio.pause();
      this.turn1CountdownAudio.currentTime = 0;
      this.turn3CountdownAudio.pause();
      this.turn3CountdownAudio.currentTime = 0;
    },
    resetRoom() {
      ElMessageBox.confirm("该操作会把房间回复到初始状态，是否确认？", "警告", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$store.dispatch("reset_room");
        })
        .catch(() => {});
    },
    addChangeCardCount(index: number) {
      const arr = [...this.roomData.change_card_count];
      arr[index]++;
      this.$store.dispatch("change_card_count", {
        cnt: arr,
      });
    },
    removeChangeCardCount(index: number) {
      const arr = [...this.roomData.change_card_count];
      arr[index]--;
      this.$store.dispatch("change_card_count", {
        cnt: arr,
      });
    },
    link(tag: string, index: number) {
      if (tag !== "A" && tag !== "B") return;
      const list = [...this["route" + tag]];
      const length = list.length;
      if (length == 1 && index === list[0]) {
        return;
      }
      if (length > 1) {
        if (list[length - 1] === index) {
          list.pop();
        } else if (list.indexOf(index) === -1) {
          list.push(index);
        }
      } else {
        list.push(index);
      }
      this["route" + tag] = list;
      this.getAvailableIndexList();
    },
    getAvailableIndexList() {
      let linkList: number[];
      let index: number;
      let endIndex: number;
      if (this.isPlayerA) {
        linkList = this.routeA;
        index = linkList[linkList.length - 1];
        endIndex = 24;
      } else if (this.isPlayerB) {
        linkList = this.routeB;
        index = linkList[linkList.length - 1];
        endIndex = 20;
      } else {
        this.availableIndexList = [];
        return;
      }
      if (index === endIndex) {
        this.availableIndexList = [index];
        return;
      }
      const list = [index - 6, index - 5, index - 4, index - 1, index, index + 1, index + 4, index + 5, index + 6];
      if (index < 5) {
        list[0] = -1;
        list[1] = -1;
        list[2] = -1;
      } else if (index > 19) {
        list[6] = -1;
        list[7] = -1;
        list[8] = -1;
      }

      if (index % 5 === 0) {
        list[0] = -1;
        list[3] = -1;
        list[6] = -1;
      } else if (index % 5 === 4) {
        list[2] = -1;
        list[5] = -1;
        list[8] = -1;
      }

      this.availableIndexList = list.filter((item) => {
        if (item === linkList[0]) return false;
        return item !== -1 && (linkList.indexOf(item) === -1 || item === index);
      });
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

.audio {
  display: none;
}

.host-buttons > * {
  margin: 0 15px;
}

.player-extra-info {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.change-card {
  padding-bottom: 64px;

  .change-card-number {
    display: flex;
    align-items: center;

    .change-card-number-btn {
      font-size: 24px;
    }

    .change-card-number-info {
      font-size: 48px;
      margin: 0 15px;
    }
  }

  .change-card-text {
    font-size: 12px;
  }
}

.spell-card-score {
  padding-bottom: 64px;

  .spell-card-score-number {
    display: flex;
    align-items: center;

    .spell-card-score-number-btn {
      font-size: 24px;
    }

    .spell-card-score-number-info {
      font-size: 48px;
      margin: 0 15px;
    }
  }

  .spell-card-score-text {
    font-size: 12px;
  }
}
</style>