<template>
  <div class="room">
    <room-layout ref="layoutRef" v-model:selected-spell-index="selectedSpellIndex" :menu="menu">
      <template #left>
        <score-board
          class="change-card"
          v-if="isBingoStandard && !isWatcher"
          :size="48"
          :manual="isHost"
          label="换卡次数"
          v-model="cardCount[0]"
          @add="addChangeCardCount(0)"
          @minus="removeChangeCardCount(0)"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分"></score-board>
        <el-button
          class="alert-button"
          type="primary"
          v-if="isHost"
          @click="alterPlayer(roomData.names[0])"
          :disabled="!inGame"
        >
          警告
        </el-button>
      </template>

      <template #right>
        <score-board
          class="change-card"
          v-if="isBingoStandard && !isWatcher"
          :size="48"
          :manual="isHost"
          label="换卡次数"
          v-model="cardCount[1]"
          @add="addChangeCardCount(1)"
          @minus="removeChangeCardCount(1)"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分"></score-board>
        <el-button
          class="alert-button"
          type="primary"
          v-if="isHost"
          @click="alterPlayer(roomData.names[1])"
          :disabled="!inGame"
        >
          警告
        </el-button>
      </template>

      <template #extra>
        <div class="bingo-effect" v-if="isBingoLink">
          <bingo-link-effect :route-a="routeA" :route-b="routeB" />
        </div>
        <game-bp v-if="isBpPhase" v-model="bpCode"></game-bp>
      </template>

      <template #widget>
        <count-down ref="countdownRef" :size="30" @complete="onCountDownComplete" v-show="inGame"></count-down>
      </template>

      <template #button-center>
        <template v-if="isBingoStandard">
          <template v-if="isHost">
            <el-button type="primary" v-if="!inGame && !isBpPhase" @click="startGame">开始比赛</el-button>
            <el-button type="primary" v-if="isBpPhase">抽取符卡</el-button>
            <el-button type="primary" v-if="inGame && winFlag === 0" @click="stopGame">结束比赛</el-button>
            <el-button type="primary" v-if="winFlag !== 0" @click="confirmWinner">
              确认：{{ winFlag < 0 ? roomData.names[0] : roomData.names[1] }}获胜
            </el-button>
          </template>

          <template v-if="isPlayer">
            <template v-if="inGame">
              <confirm-select-button
                @click="confirmSelect"
                :disabled="selectedSpellIndex < 0 || gamePaused"
                v-if="!spellCardSelected"
                :cooldown="roomConfig.cdTime"
                :startTime="cooldownStartTime"
                :immediate="gamePhase > 1"
                text="选择符卡"
              ></confirm-select-button>
              <confirm-select-button
                @click="confirmAttained"
                v-if="spellCardSelected"
                :disabled="gamePhase < 2 || gamePaused"
                :cooldown="roomSettings.confirmDelay"
                text="确认收取"
              ></confirm-select-button>
            </template>

            <el-button
              type="primary"
              v-if="isBpPhase"
              :disabled="(!(isPlayerA && playerACanBP) && !(isPlayerB && playerBCanBP)) || !bpCode"
              >确定</el-button
            >
          </template>
        </template>

        <template v-if="isBingoBp">
          <el-button type="primary" v-if="!inGame">开始比赛</el-button>
          <el-button type="primary" v-else>结束比赛</el-button>
        </template>

        <template v-if="isBingoLink">
          <el-button type="primary" v-if="!inGame">开始比赛</el-button>
          <el-button type="primary" v-else>结束比赛</el-button>
        </template>
      </template>

      <template #button-left-1 v-if="isHost">
        <template v-if="isBingoStandard">
          <el-button size="small" :disabled="inGame" @click="resetRoom">重置房间</el-button>
        </template>
      </template>

      <template #button-right-1 v-if="isHost">
        <template v-if="isBingoStandard">
          <el-button size="small" :disabled="gamePhase !== 2" v-if="gamePaused" @click="resumeGame">继续比赛</el-button>
          <el-button size="small" :disabled="gamePhase !== 2" v-else @click="pauseGame">暂停比赛</el-button>
        </template>
      </template>
    </room-layout>
  </div>
</template>

<script lang="ts">
import { defineComponent, h, ref, computed, watch, nextTick, onMounted } from "vue";
import { useStore } from "vuex";
import { Role, BingoType, BpStatus } from "@/types";
import RoomLayout from "./components/roomLayout.vue";
import BingoLinkEffect from "@/components/bingo-effect/link.vue";
import ScoreBoard from "@/components/score-board.vue";
import CountDown from "@/components/count-down.vue";
import GameBp from "@/components/game-bp.vue";
import ConfirmSelectButton from "@/components/button-with-cooldown.vue";
import { ElButton, ElMessageBox, ElRadioGroup, ElRadio } from "element-plus";
import Mit from "@/mitt";
import GameTime from "@/utils/GameTime";

export default defineComponent({
  name: "Room",
  components: {
    RoomLayout,
    BingoLinkEffect,
    ScoreBoard,
    ElButton,
    ConfirmSelectButton,
    CountDown,
    GameBp,
  },
  setup() {
    const store = useStore();
    const countdownRef = ref<InstanceType<typeof CountDown>>();
    const layoutRef = ref<InstanceType<typeof RoomLayout>>();

    const gameData = computed(() => store.getters.gameData);
    const roomData = computed(() => store.getters.roomData);
    const roomSettings = computed(() => store.getters.roomSettings);
    const roomConfig = computed(() => store.getters.roomData.room_config);
    const banPickInfo = computed(() => store.getters.banPickInfo);
    const soloMode = computed(() => store.getters.soloMode);
    const userRole = computed(() => store.getters.userRole);
    const isHost = computed(() => store.getters.userRole === Role.HOST);
    const isPlayer = computed(() => store.getters.userRole === Role.PLAYER);
    const isWatcher = computed(() => store.getters.userRole === Role.WATHCER);
    const isPlayerA = computed(() => store.getters.isPlayerA);
    const isPlayerB = computed(() => store.getters.isPlayerB);
    const playerAName = computed(() => store.getters.roomData.names[0]);
    const playerBName = computed(() => store.getters.roomData.names[1]);
    const isBingoStandard = computed(() => store.getters.roomData.type === BingoType.STANDARD);
    const isBingoBp = computed(() => store.getters.roomData.type === BingoType.BP);
    const isBingoLink = computed(() => store.getters.roomData.type === BingoType.LINK);
    const inGame = computed(() => store.getters.inGame);
    const bpStatus = computed(() => store.getters.bpStatus);
    const playerACanBP = computed(
      () =>
        bpStatus.value === BpStatus.IS_A_BAN ||
        bpStatus.value === BpStatus.IS_A_PICK ||
        bpStatus.value === BpStatus.SELECT_OPEN_EX
    );
    const playerBCanBP = computed(
      () =>
        bpStatus.value === BpStatus.IS_B_BAN ||
        bpStatus.value === BpStatus.IS_B_PICK ||
        bpStatus.value === BpStatus.SELECT_OPEN_EX
    );
    const playerASelectedIndex = computed(() => store.getters.playerASelectedIndex);
    const playerBSelectedIndex = computed(() => store.getters.playerBSelectedIndex);
    const gamePaused = computed(() => store.getters.gamePaused);
    const gamePhase = computed(() => store.getters.gameData.phase || 0);
    const timeMistake = computed(() => store.getters.heartBeat.timeMistake);
    const spellCardSelected = computed(() => {
      if (isPlayerA.value) {
        return playerASelectedIndex.value !== -1;
      }
      if (isPlayerB.value) {
        return playerBSelectedIndex.value !== -1;
      }
      return false;
    });
    const cooldownStartTime = computed(() => {
      const lastGetTime = store.getters.gameData.last_get_time;
      if (isPlayerA.value) {
        return lastGetTime[0];
      } else if (isPlayerB.value) {
        return lastGetTime[1];
      } else {
        return 0;
      }
    });
    const menu = computed<{ label: string; value: number; tag?: string }[]>(() => {
      let data: { label: string; value: number; tag?: string }[] = [];
      switch (roomData.value.type) {
        case BingoType.STANDARD:
          if (soloMode.value) {
            data = [
              {
                label: "置空",
                value: 0,
              },
            ];
            if (isPlayerA.value) {
              data.push({
                label: "收取",
                value: 5,
                tag: "playerA",
              });
            }
            if (isPlayerB.value) {
              data.push({
                label: "收取",
                value: 7,
                tag: "playerB",
              });
            }
          } else {
            if (isHost.value) {
              data = [
                {
                  label: "置空",
                  value: 0,
                },
                {
                  label: "左侧玩家选择",
                  value: 1,
                  tag: "playerA",
                },
                {
                  label: "右侧玩家选择",
                  value: 3,
                  tag: "playerB",
                },
                {
                  label: "两侧玩家选择",
                  value: 2,
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
              ];
            }
          }
          break;
        case BingoType.BP:
          data = [];
          break;
        case BingoType.LINK:
          data = [];
          break;
      }
      return data;
    });

    const selectedSpellIndex = ref(-1);
    const winFlag = ref(0);
    const isBpPhase = ref(false);
    const bpCode = ref("");

    //standard
    const oldSumArr = ref<number[]>([]);
    const playerAScore = ref(0);
    const playerBScore = ref(0);
    const cardCount = ref([2, 2]);

    //bp

    //link
    const routeA = ref([]);
    const routeB = ref([]);

    const startGame = () => {
      if (roomSettings.value.gamebp) {
        store.dispatch("start_ban_pick", {
          who_first: 0,
        });
        isBpPhase.value = true;
      } else {
        store
          .dispatch("update_room_config", {
            room_config: {
              game_time: roomSettings.value.gameTimeLimit,
              countdown: roomSettings.value.countdownTime,
              cd_time: roomSettings.value.cdTime,
              games: roomSettings.value.checkList,
              ranks: roomSettings.value.rankList,
              difficulty: roomSettings.value.difficulty,
              need_win: (roomSettings.value.format + 1) / 2,
              is_private: roomSettings.value.private,
            },
          })
          .then(() => {
            store.dispatch("start_game").then(() => {
              store.dispatch("change_card_count", {
                cnt: [roomSettings.value.playerA.changeCardCount, roomSettings.value.playerB.changeCardCount],
              });
              store.commit("change_game_state", true);
              store.dispatch("set_phase", { phase: 1 }).then(() => {
                layoutRef.value?.hideAlert();
                countdownRef.value?.start();
              });
            });
          });
      }
    };
    const stopGame = () => {
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
                  default: () => roomData.value.names[0] + "获胜",
                }
              ),
              h(
                ElRadio,
                {
                  label: 1,
                },
                {
                  default: () => roomData.value.names[1] + "获胜",
                }
              ),
            ]
          ),
      })
        .then(() => {
          //winner
          if ((checked.value as number) < 0) {
            store.dispatch("stop_game", { winner: -1 }).then(() => {
              store.dispatch("set_phase", { phase: 0 });
            });
          } else {
            store.dispatch("stop_game", { winner: checked.value }).then(() => {
              store.dispatch("set_phase", { phase: 0 });
            });
          }
        })
        .catch(() => {});
    };
    const pauseGame = () => {
      store.dispatch("pause", { pause: true });
    };
    const resumeGame = () => {
      store.dispatch("pause", { pause: false });
    };
    const confirmWinner = () => {
      store.dispatch("stop_game", { winner: winFlag.value < 0 ? 0 : 1 }).then(() => {
        winFlag.value = 0;
        countdownRef.value?.stop();
      });
    };
    const confirmSelect = () => {
      if (isPlayerA.value) {
        store.dispatch("update_spell", { idx: selectedSpellIndex.value, status: 1 }).then(() => {
          selectedSpellIndex.value = -1;
        });
      }
      if (isPlayerB.value) {
        store.dispatch("update_spell", { idx: selectedSpellIndex.value, status: 3 }).then(() => {
          selectedSpellIndex.value = -1;
        });
      }
    };
    const confirmAttained = () => {
      if (isPlayerA.value) {
        store.dispatch("update_spell", { idx: playerASelectedIndex.value, status: 5 });
        store.commit("set_last_get_time", {
          index: 0,
          time: new Date().getTime() + timeMistake.value,
        });
      }
      if (isPlayerB.value) {
        store.dispatch("update_spell", { idx: playerBSelectedIndex.value, status: 7 });
        store.commit("set_last_get_time", {
          index: 1,
          time: new Date().getTime() + timeMistake.value,
        });
      }
    };
    const alterPlayer = (name: string) => {
      store.dispatch("warn_player", {
        name,
      });
    };
    const onCountDownComplete = () => {
      if (gamePhase.value === 1) {
        if (isHost.value) {
          store.dispatch("set_phase", { phase: 2 }).then(() => {
            countdownRef.value?.start();
          });
        } else {
          store.dispatch("get_spells");
        }
      } else if (gamePhase.value === 2) {
        if (isHost.value) {
          store.dispatch("set_phase", { phase: 0 });
        }
      }
    };
    const resetRoom = () => {
      ElMessageBox.confirm("该操作会把房间回复到初始状态，是否确认？", "警告", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          store.dispatch("reset_room");
        })
        .catch(() => {});
    };
    const addChangeCardCount = (index: number) => {
      const arr = [...roomData.value.change_card_count];
      arr[index]++;
      store.dispatch("change_card_count", {
        cnt: arr,
      });
    };
    const removeChangeCardCount = (index: number) => {
      const arr = [...roomData.value.change_card_count];
      arr[index]--;
      store.dispatch("change_card_count", {
        cnt: arr,
      });
    };

    onMounted(() => {
      cardCount.value = roomData.value.change_card_count;
      if (!inGame.value) {
        layoutRef.value?.showAlert("等待房主开始比赛", "#000");
      }
    });

    watch(gameData, (newVal, oldVal) => {
      if (newVal.start_time) {
        const isStandByPhase = GameTime.main <= 0;
        if (isStandByPhase) {
          nextTick(() => {
            countdownRef.value?.start();
          });
        } else {
          if (isHost.value && newVal.phase < 2) {
            store.dispatch("set_phase", { phase: 2 });
          }
          nextTick(() => {
            countdownRef.value?.start();
            if (newVal.pause_begin_ms) {
              countdownRef.value?.pause();
            }
          });
        }
      } else {
        store.commit("change_game_state", false);
      }

      if (newVal.phase === 2 && oldVal.phase === 1 && !isHost.value) {
        store.dispatch("get_spells");
      }

      const status = newVal.status;
      if (status && status.length) {
        const available: number[] = new Array(12).fill(2);
        const sumArr: number[] = new Array(12).fill(0);
        winFlag.value = 0;
        let countA = 0;
        let countB = 0;
        let scoreA = 0;
        let scoreB = 0;
        status.forEach((item: number, index: number) => {
          const rowIndex = Math.floor(index / 5);
          const columnIndex = index % 5;
          if (item === 5) {
            countA++;
            scoreA += 1;
            if (available[rowIndex] > 0) available[rowIndex] -= 2;
            if (available[columnIndex + 5] > 0) available[columnIndex + 5] -= 2;
            sumArr[rowIndex] -= 1;
            sumArr[columnIndex + 5] -= 1;
            if (index % 6 === 0) {
              sumArr[10] -= 1;
              if (available[10] > 0) available[10] -= 2;
            }
            if (index && index !== 24 && index % 4 === 0) {
              sumArr[11] -= 1;
              if (available[11] > 0) available[11] -= 2;
            }
          } else if (item === 7) {
            countB++;
            scoreB += 1;
            if (available[rowIndex] % 2 === 0) available[rowIndex] -= 1;
            if (available[columnIndex + 5] % 2 === 0) available[columnIndex + 5] -= 1;
            sumArr[rowIndex] += 1;
            sumArr[columnIndex + 5] += 1;
            if (index % 6 === 0) {
              sumArr[10] += 1;
              if (available[10] % 2 === 0) available[10] -= 1;
            }
            if (index && index !== 24 && index % 4 === 0) {
              sumArr[11] += 1;
              if (available[11] % 2 === 0) available[11] -= 1;
            }
          }
        });

        let gamePointFlag = false;
        for (let i = 0; i < 12; i++) {
          if (sumArr[i] === -5) {
            winFlag.value = -(i + 1);
            break;
          } else if (sumArr[i] === 5) {
            winFlag.value = i + 1;
            break;
          } else if (
            (sumArr[i] === -4 && oldSumArr.value[i] > -4 && isPlayerB.value) ||
            (sumArr[i] === 4 && oldSumArr.value[i] < 4 && isPlayerA.value)
          ) {
            gamePointFlag = true;
          }
        }
        if (gamePointFlag) {
          Mit.emit("game_point");
        }
        oldSumArr.value = sumArr;

        playerAScore.value = scoreA;
        playerBScore.value = scoreB;

        if (countA >= 13) {
          winFlag.value = -13;
        }
        if (countB >= 13) {
          winFlag.value = 13;
        }
        if (winFlag.value !== 0) {
          layoutRef.value?.showAlert("已满足胜利条件，等待房主判断", "red");
        }
      }
    });

    watch(roomData, (newVal, oldVal) => {
      if (newVal.winner !== undefined) {
        ElMessageBox.alert(`${roomData.value.names[newVal.winner]}获胜`, "比赛结束", {
          confirmButtonText: "确定",
        });
        delete newVal.winner;
      }
      cardCount.value = newVal.change_card_count;
    });

    watch(inGame, (newVal, oldVal) => {
      if (!newVal) {
        layoutRef.value?.showAlert("等待房主开始比赛", "#000");
      } else {
        layoutRef.value?.hideAlert();
      }
    });

    watch(gamePaused, (newVal, oldVal) => {
      if (newVal) {
        layoutRef.value?.showAlert("游戏已暂停", "#000");
        countdownRef.value?.pause();
      } else {
        layoutRef.value?.hideAlert();
        countdownRef.value?.start();
      }
    });

    watch(banPickInfo, (newVal, oldVal) => {
      console.log(newVal);
      if (newVal.phase) {
        isBpPhase.value = true;
        console.log(isBpPhase.value);
      }
    });

    return {
      countdownRef,
      layoutRef,
      gameData,
      roomData,
      roomSettings,
      roomConfig,
      banPickInfo,
      userRole,
      isHost,
      isPlayer,
      isWatcher,
      isPlayerA,
      isPlayerB,
      playerAName,
      playerBName,
      playerACanBP,
      playerBCanBP,
      isBingoStandard,
      isBingoBp,
      isBingoLink,
      inGame,
      bpStatus,
      isBpPhase,
      playerASelectedIndex,
      playerBSelectedIndex,
      gamePaused,
      gamePhase,
      timeMistake,
      spellCardSelected,
      cooldownStartTime,
      menu,
      selectedSpellIndex,
      winFlag,
      bpCode,
      oldSumArr,
      playerAScore,
      playerBScore,
      cardCount,
      routeA,
      routeB,
      startGame,
      stopGame,
      pauseGame,
      resumeGame,
      confirmWinner,
      confirmSelect,
      confirmAttained,
      alterPlayer,
      onCountDownComplete,
      resetRoom,
      addChangeCardCount,
      removeChangeCardCount,
    };
  },
});
</script>

<style lang="scss" scoped>
.bingo-effect {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 99;
}
</style>
