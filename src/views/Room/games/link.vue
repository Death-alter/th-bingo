<!-- eslint-disable vue/no-parsing-error -->
<template>
  <div class="rule-standard">
    <el-row>
      <el-col :span="4">
        <div class="player-extra-info" v-if="inGame">
          <div class="spell-card-score">
            <div class="spell-card-score-number">
              <div class="spell-card-score-number-info">
                {{ playerAScore * 2 + (spendTimeScore > 0 ? " + " + spendTimeScore.toFixed(1) : "") }}
              </div>
            </div>
            <div class="spell-card-score-text">得分</div>
            <div class="spell-card-score-text">{{ timeFormat(spendTimeA) }}</div>
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
            v-model="countDownSeconds"
            :mode="countDownMode"
            @complete="onCountDownComplete"
            v-show="inGame"
          ></count-down>
        </div>
        <div v-if="isHost" class="host-buttons">
          <el-button v-if="!inGame" size="small" @click="resetRoom">重置房间</el-button>
          <el-button v-else size="small" @click="pause" :disabled="gamePhase !== 2">{{
            gamePaused ? "继续比赛" : "暂停比赛"
          }}</el-button>
          <el-button type="primary" @click="start" v-if="winFlag === 0">{{
            inGame ? "结束比赛" : "抽取符卡"
          }}</el-button>
          <el-button type="primary" @click="confirmWinner" v-else
            >确认：{{ winFlag < 0 ? roomData.names[0] : roomData.names[1] }}获胜</el-button
          >
          <el-button size="small" @click="nextRound" :disabled="gamePhase < 2 || gamePhase > 3 || gamePaused">{{
            gamePhase === 3 && !this.gameData.link_data.start_ms_b ? "开始计时" : "结束计时"
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
      </el-col>
      <el-col :span="4">
        <div class="player-extra-info" v-if="inGame">
          <div class="spell-card-score">
            <div class="spell-card-score-number">
              <div class="spell-card-score-number-info">
                {{ playerBScore * 2 + (spendTimeScore < 0 ? "+" + (-spendTimeScore).toFixed(1) : "") }}
              </div>
            </div>
            <div class="spell-card-score-text">得分</div>
            <div class="spell-card-score-text">{{ timeFormat(spendTimeB) }}</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, h, getCurrentInstance, onMounted, onUnmounted, watch } from "vue";
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
      playerAScore: 0,
      playerBScore: 0,
      routeA: [0],
      routeB: [4],
      spendTimeA: null as number | null,
      spendTimeB: null as number | null,
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
    const { proxy }: any = getCurrentInstance();
    const gamePhase = computed(() => store.getters.gameData.phase || 0);

    onMounted(() => {
      proxy.$bus.on("A_link_change", (index: number) => {
        if (proxy.isHost || proxy.isWatcher) {
          if (!(proxy.gamePhase === 2 && proxy.countDownSeconds < 5)) {
            proxy.link("A", index);
          }
        } else if (proxy.gamePhase > 1) {
          proxy.link("A", index);
        }
      });
      proxy.$bus.on("B_link_change", (index: number) => {
        if (proxy.isHost || proxy.isWatcher) {
          if (!(proxy.gamePhase === 2 && proxy.countDownSeconds < 5)) {
            proxy.link("B", index);
          }
        } else if (proxy.gamePhase > 1) {
          proxy.link("B", index);
        }
      });
    });

    onUnmounted(() => {
      proxy.$bus.off("A_link_change");
      proxy.$bus.off("B_link_change");
    });

    watch(gamePhase, (newVal, oldVal) => {
      if (oldVal === 2 && newVal === 3) {
        proxy.$bus.emit("right_link_start");
      }
    });

    return {
      timeMistake: computed(() => store.getters.heartBeat.timeMistake),
      gameData: computed(() => store.getters.gameData),
      roomData: computed(() => store.getters.roomData),
      roomSettings: computed(() => store.getters.roomSettings),
      inRoom: computed(() => store.getters.inRoom),
      isHost: computed(() => store.getters.isHost),
      isWatcher: computed(() => store.getters.isWatcher),
      inGame: computed(() => store.getters.inGame),
      gamePhase,
      gamePaused: computed(() => {
        if (store.getters.gameData.link_data) {
          const link_data = proxy.gameData.link_data;
          if (proxy.gamePhase === 2 && link_data.start_ms_a && link_data.end_ms_a) {
            return true;
          } else if (proxy.gamePhase === 3 && link_data.start_ms_b && link_data.end_ms_b) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }),
      isPlayerA: computed(() => store.getters.isPlayerA),
      isPlayerB: computed(() => store.getters.isPlayerB),
      playerASelectedIndex: computed(() => store.getters.playerASelectedIndex),
      playerBSelectedIndex: computed(() => store.getters.playerBSelectedIndex),
      spellCardSelected: computed(() => {
        if (store.getters.isPlayerA) {
          return store.getters.playerASelectedIndex !== -1;
        }
        if (store.getters.isPlayerB) {
          return store.getters.playerBSelectedIndex !== -1;
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
      countDownMode: computed(() => {
        if (proxy.gamePhase > 1) {
          return "stopwatch";
        }
        return "countdown";
      }),
      spendTimeScore: computed(() => {
        if (proxy.gamePhase !== 4) {
          return 0;
        }
        const delta = (proxy.spendTimeB - proxy.spendTimeA) / 10000;
        return delta;
        // return delta > 0 ? Math.floor(delta) : Math.ceil(delta);
      }),
      countDown,
      Minus,
      Plus,
    };
  },
  mounted() {
    if (!this.isHost) {
      this.getAvailableIndexList();
    }
  },
  watch: {
    gameData(value) {
      const currentTime = new Date().getTime() + this.timeMistake;
      this.winFlag = 0;
      if (value.start_time) {
        const startTime = value.start_time;
        const pasedTime = (currentTime - startTime) / 1000;
        const standbyCountDown = value.countdown - pasedTime;

        if (standbyCountDown > 0) {
          this.countDownSeconds = Math.ceil(standbyCountDown);
          this.$nextTick(() => {
            this.countDown.start();
          });
        } else if (this.isHost) {
          if (!value.link_data.start_ms_a && value.phase !== 2) {
            this.$store.dispatch("set_phase", { phase: 2 }).then(() => {
              this.$store.dispatch("link_time", { whose: 0, event: 1 }).then(() => {
                this.countDown.start();
              });
            });
          }
        }
      } else {
        this.$store.commit("change_game_state", false);
        this.availableIndexList = [];
      }

      if (value.link_data) {
        if (value.link_data.link_idx_a) {
          if (!this.isPlayerB || value.phase !== 1) {
            this.routeA = value.link_data.link_idx_a;
          } else {
            this.routeA = [0];
          }
        }
        if (value.link_data.link_idx_b) {
          if (!this.isPlayerA || value.phase !== 1) {
            this.routeB = value.link_data.link_idx_b;
          } else {
            this.routeB = [4];
          }
        }

        if (value.phase === 2 && value.link_data.start_ms_a) {
          this.countDownSeconds = Math.floor(
            ((this.gamePaused ? value.link_data.end_ms_a : currentTime) - value.link_data.start_ms_a) / 1000
          );
          if (!this.gamePaused) {
            this.$nextTick(() => {
              this.countDown.start();
            });
          }
        } else if (value.phase >= 3) {
          this.spendTimeA = value.link_data.end_ms_a - value.link_data.start_ms_a;
          let sum = 0;
          for (let item of this.routeA) {
            sum += value.spells[item].star;
          }
          this.playerAScore = sum;
          if (value.phase === 4) {
            this.spendTimeB = value.link_data.end_ms_b - value.link_data.start_ms_b;
            this.countDown.stop();
            let sum = 0;
            for (let item of this.routeB) {
              sum += value.spells[item].star;
            }
            this.playerBScore = sum;
            this.alertInfo = "比赛已结束，等待房主操作";
            this.alertInfoColor = "red";
            this.confirmed = false;
            if (this.playerAScore * 2 + this.spendTimeScore > this.playerBScore * 2) {
              this.winFlag = -1;
            } else {
              this.winFlag = 1;
            }
          } else {
            if (!this.gamePaused && value.link_data.start_ms_b) {
              this.countDownSeconds = Math.floor(
                ((this.gamePaused ? value.link_data.end_ms_b : currentTime) - value.link_data.start_ms_b) / 1000
              );
              this.$nextTick(() => {
                this.countDown.start();
              });
            } else {
              this.countDown.stop();
            }
          }
        }

        if (this.routeComplete && value.phase > 1) {
          this.confirmed = true;
          this.availableIndexList = [];
        } else {
          this.getAvailableIndexList();
        }
        delete value.link_data.link_idx_a;
        delete value.link_data.link_idx_b;
      }
    },
    roomData(value) {
      if (!value.started) {
        this.alertInfo = "等待房主抽取符卡";
        this.alertInfoColor = "#000";
        this.routeA = [];
        this.routeB = [];
        this.playerAScore = 0;
        this.playerBScore = 0;
        this.spendTimeA = 0;
        this.spendTimeB = 0;
        this.availableIndexList = [];
        this.confirmed = false;
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
        this.countDownSeconds = 0;
        this.countDown.stop();
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
          })
            .then(() => {
              //winner
              if (checked.value < 0) {
                this.$store.dispatch("stop_game", { winner: -1 }).then(() => {
                  this.$store.dispatch("set_phase", { phase: 0 }).then(() => {
                    this.countDownSeconds = this.roomSettings.countDownTime;
                  });
                });
              } else {
                this.$store.dispatch("stop_game", { winner: checked.value }).then(() => {
                  this.$store.dispatch("set_phase", { phase: 0 }).then(() => {
                    this.countDownSeconds = this.roomSettings.countDownTime;
                  });
                });
              }
            })
            .catch(() => {});
        }
      } else {
        this.$store
          .dispatch("start_game", {
            game_time: this.roomSettings.gameTimeLimit,
            countdown: this.roomSettings.countDownTime,
            games: this.roomSettings.checkList,
            ranks: this.roomSettings.rankList,
            difficulty: this.roomSettings.difficulty,
            need_win: (this.roomSettings.format + 1) / 2,
            enable_tools: this.roomSettings.enableTools,
            is_private: this.roomSettings.private,
          })
          .then(() => {
            this.$store.commit("change_game_state", true);
            this.$store.dispatch("set_phase", { phase: 1 }).then(() => {
              this.countDown.start();
            });
          });
      }
    },
    pause() {
      if (this.gamePaused) {
        this.$store.dispatch("link_time", { whose: this.gamePhase > 2 ? 1 : 0, event: 1 });
      } else {
        this.$store.dispatch("link_time", { whose: this.gamePhase > 2 ? 1 : 0, event: 2 });
      }
    },
    nextRound() {
      if (this.gamePhase === 2) {
        this.$store.dispatch("set_phase", { phase: 3 }).then(() => {
          this.$store.dispatch("link_time", { whose: 0, event: 3 }).then(() => {
            this.countDown.stop();
          });
        });
      } else if (this.gamePhase === 3) {
        if (!this.gameData.link_data.start_ms_b) {
          this.$store.dispatch("link_time", { whose: 1, event: 1 }).then(() => {
            this.countDown.start();
          });
        } else {
          this.$store.dispatch("link_time", { whose: 1, event: 3 }).then(() => {
            this.$store.dispatch("set_phase", { phase: 4 }).then(() => {
              this.countDown.stop();
            });
          });
        }
      }
    },
    onCountDownComplete() {
      if (this.gamePhase === 1) {
        this.countDownSeconds = 0;
        if (this.routeComplete) {
          this.availableIndexList = [];
          this.confirmed = true;
        }
        if (this.isHost) {
          this.$store.dispatch("set_phase", { phase: 2 }).then(() => {
            this.$store.dispatch("link_time", { whose: 0, event: 1 }).then(() => {
              this.countDown.start();
            });
          });
        }
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
        this.$store.dispatch("set_phase", { phase: 0 }).then(() => {
          this.winFlag = 0;
        });
      });
    },
    onMenuClick({ event, target, item }: any) {
      const index = target.getAttribute("index");
      if (index !== null) {
        this.$store.dispatch("update_spell", { idx: parseInt(index), status: item.value });
      }
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
    link(tag: string, index: number) {
      if (tag !== "A" && tag !== "B") return;
      const list = [...this["route" + tag]];
      const length = list.length;
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
      if ((this.isPlayerA && tag === "A") || (this.isPlayerB && tag === "B")) {
        this.getAvailableIndexList();
      }
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
    timeFormat(time: number | null) {
      function format(number: number): string {
        return number < 10 ? `0${number}` : "" + number;
      }

      if (!time) {
        return "";
      }
      time = Math.floor(time / 1000);
      let second, hour, minute;
      second = time % 60;
      if (time >= 3600) {
        hour = Math.floor(time / 3600);
        minute = Math.floor(time / 60) % 60;
      } else {
        minute = Math.floor(time / 60);
      }
      return (hour ? format(hour) + "h " : "") + (minute ? format(minute) + "m " : "") + format(second) + "s";
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

.spell-card-score {
  padding-bottom: 64px;

  .spell-card-score-number {
    display: flex;
    align-items: center;
    justify-content: center;

    .spell-card-score-number-btn {
      font-size: 24px;
    }

    .spell-card-score-number-info {
      font-size: 28px;
      margin: 0 15px;
    }
  }

  .spell-card-score-text {
    font-size: 12px;
    height: 16px;
  }
}
</style>
