<template>
  <div class="room">
    <room-layout ref="layoutRef" v-model:selected-spell-index="selectedSpellIndex" :menu="menu">
      <template #left>
        <score-board
          class="change-card"
          v-if="isBingoStandard"
          :size="48"
          :manual="soloMode ? isPlayerA : isHost"
          label="换卡次数"
          v-model="cardCount[0]"
          @add="addChangeCardCount(0)"
          @minus="removeChangeCardCount(0)"
          :disabled="!inGame"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分"></score-board>
        <el-button
          class="alert-button"
          type="primary"
          v-if="isHost"
          @click="warnPlayer(roomData.names[0])"
          :disabled="!inGame"
        >
          警告
        </el-button>
      </template>

      <template #right>
        <score-board
          class="change-card"
          v-if="isBingoStandard"
          :size="48"
          :manual="soloMode ? isPlayerB : isHost"
          label="换卡次数"
          v-model="cardCount[1]"
          @add="addChangeCardCount(1)"
          @minus="removeChangeCardCount(1)"
          :disabled="!inGame"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分"></score-board>
        <el-button
          class="alert-button"
          type="primary"
          v-if="isHost"
          @click="warnPlayer(roomData.names[1])"
          :disabled="!inGame"
        >
          警告
        </el-button>
      </template>

      <!-- <template #extra>
        <div class="bingo-effect" v-if="isBingoLink">
          <bingo-link-effect :route-a="routeA" :route-b="routeB" />
        </div>
        <game-bp v-if="isBpPhase" v-model="bpCode"></game-bp>
      </template> -->

      <template #widget>
        <count-down ref="countdownRef" :size="30" @complete="onCountDownComplete" v-show="inGame"></count-down>
      </template>

      <template #button-center>
        <template v-if="isBingoStandard">
          <template v-if="!soloMode && isHost">
            <el-button type="primary" v-if="!inGame && !isBpPhase" @click="startGame">开始比赛</el-button>
            <el-button type="primary" v-if="isBpPhase" @click="drawSpellCard" :disabled="banPick.phase < 99">
              抽取符卡
            </el-button>
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
                :cooldown="roomConfig.cd_time"
                :startTime="cooldownStartTime"
                :immediate="gameStore.gameStatus == GameStatus.STARTED"
                text="选择符卡"
              ></confirm-select-button>
              <confirm-select-button
                @click="confirmAttained"
                v-if="spellCardSelected"
                :disabled="gameStore.gameStatus !== GameStatus.STARTED"
                :cooldown="roomSettings.confirmDelay"
                text="确认收取"
              ></confirm-select-button>
            </template>

            <template v-if="isBpPhase">
              <el-button
                type="primary"
                v-if="banPick.phase !== 11"
                :disabled="!(isPlayerA && playerACanBP) && !(isPlayerB && playerBCanBP)"
                @click="playerBanPick"
                >确定</el-button
              >
              <el-button type="primary" v-if="banPick.phase === 11" @click="confirmOpenEX(true)">开启</el-button>
              <el-button type="primary" v-if="banPick.phase === 11" @click="confirmOpenEX(false)">不开启</el-button>
            </template>
          </template>

          <template v-if="soloMode && isPlayerA">
            <el-button type="primary" v-if="!inGame && !isBpPhase" @click="startGame">开始比赛</el-button>
            <el-button type="primary" v-if="isBpPhase" @click="drawSpellCard">抽取符卡</el-button>
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

      <template #button-left-1>
        <template v-if="isBingoStandard">
          <template v-if="!soloMode && isHost">
            <el-button size="small" :disabled="inGame" @click="resetRoom">重置房间</el-button>
          </template>
          <template v-if="soloMode && isPlayerA">
            <el-button v-if="isPlayerA && !inGame" size="small" @click="resetRoom">重置房间</el-button>
            <el-button v-if="isPlayerA && inGame" size="small" @click="stopGame">结束比赛</el-button>
          </template>
        </template>
      </template>

      <template #button-right-1>
        <template v-if="isBingoStandard">
          <template v-if="(!soloMode && isHost) || (soloMode && isPlayerA)">
            <el-button
              size="small"
              :disabled="gameStore.gameStatus !== GameStatus.STARTED"
              v-if="gamePaused"
              @click="resumeGame"
            >
              继续比赛
            </el-button>
            <el-button size="small" :disabled="gameStore.gameStatus !== GameStatus.STARTED" v-else @click="pauseGame"
              >暂停比赛</el-button
            >
          </template>
        </template>
      </template>
    </room-layout>
  </div>
</template>

<script lang="ts" setup>
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { Role, BingoType, BpStatus, GameStatus } from "@/types";
import RoomLayout from "./components/roomLayout.vue";
import BingoLinkEffect from "@/components/bingo-effect/link.vue";
import ScoreBoard from "@/components/score-board.vue";
import CountDown from "@/components/count-down.vue";
import GameBp from "@/components/game-bp.vue";
import SpellCardCell from "@/components/spell-card-cell.vue";
import ConfirmSelectButton from "@/components/button-with-cooldown.vue";
import { ElButton, ElMessageBox, ElRadioGroup, ElRadio } from "element-plus";
import { local } from "@/utils/Storage";
import GameTime from "@/utils/GameTime";
import { useRouter } from "vue-router";
import { MaoYu } from "@/utils/AI";
import ws from "@/utils/webSocket/WebSocketBingo";
import { useRoomStore } from "@/store/RoomStore";
import { useGameStore } from "@/store/GameStore";
import { WebSocketActionType } from "@/utils/webSocket/types";
import { fa } from "element-plus/es/locale";

const roomStore = useRoomStore();
const gameStore = useGameStore();

const countdownRef = ref<InstanceType<typeof CountDown>>();
const layoutRef = ref<InstanceType<typeof RoomLayout>>();
const roomData = computed(() => roomStore.roomData);
const roomSettings = computed(() => roomStore.roomSettings);
const roomConfig = computed(() => roomStore.roomConfig);
const banPick = computed(() => gameStore.banPick);
const soloMode = computed(() => roomStore.soloMode);
const isHost = computed(() => roomStore.isHost);
const isPlayer = computed(() => roomStore.isPlayer);
const isWatcher = computed(() => roomStore.isWatcher);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const isOwner = computed(() => (soloMode.value && isPlayerA.value) || (!soloMode.value && isHost.value));
const playerAName = computed(() => roomData.value.names[0]);
const playerBName = computed(() => roomData.value.names[1]);
const isBingoStandard = computed(() => roomStore.roomData.type === BingoType.STANDARD);
const isBingoBp = computed(() => roomStore.roomData.type === BingoType.BP);
const isBingoLink = computed(() => roomStore.roomData.type === BingoType.LINK);
const inGame = computed(() => roomStore.inGame);
const inMatch = computed(() => gameStore.inMatch);
const isBpPhase = computed(
  () => gameStore.banPick.phase && gameStore.banPick.phase > 0 && (gameStore.banPick.phase < 99 || !inGame.value)
);
const bpStatus = computed(() => gameStore.bpStatus);
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
const playerASelectedIndex = computed(() => gameStore.playerASelectedIndex);
const playerBSelectedIndex = computed(() => gameStore.playerBSelectedIndex);
const gamePaused = computed(() => gameStore.gameStatus === GameStatus.PAUSED);
// const timeMistake = computed(() => store.getters.heartBeat.timeMistake);
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
  // const lastGetTime = store.getters.gameData.last_get_time;
  // if (isPlayerA.value) {
  //   return lastGetTime[0];
  // } else if (isPlayerB.value) {
  //   return lastGetTime[1];
  // } else {
  //   return 0;
  // }
  return 0;
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
          data = [
            ...data,
            {
              label: "选择",
              value: 1,
              tag: "playerA",
            },
            {
              label: "收取",
              value: 5,
              tag: "playerA",
            },
          ];
        }
        if (isPlayerB.value) {
          data = [
            ...data,
            {
              label: "选择",
              value: 3,
              tag: "playerB",
            },
            {
              label: "收取",
              value: 7,
              tag: "playerB",
            },
          ];
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
const bpCode = ref("");
//standard
const oldSumArr = ref<number[]>([]);
const playerAScore = ref(0);
const playerBScore = ref(0);
const cardCount = ref([2, 2]);

// //bp
//link
// const routeA = ref([]);
// const routeB = ref([]);
const startGame = () => {
  if (roomSettings.value.gamebp && !inMatch.value) {
    gameStore.startBanPick();
  } else {
    gameStore.startGame().then(() => {
      roomStore.updateChangeCardCount(roomData.value.names[0], roomSettings.value.playerA.changeCardCount);
      roomStore.updateChangeCardCount(roomData.value.names[1], roomSettings.value.playerB.changeCardCount);
      layoutRef.value?.hideAlert();
      countdownRef.value?.start();
    });
  }
};
const drawSpellCard = () => {
  roomStore.updateRoomConfig().then(() => {
    gameStore.startGame().then(() => {
      roomStore.updateChangeCardCount(roomData.value.names[0], roomSettings.value.playerA.changeCardCount);
      roomStore.updateChangeCardCount(roomData.value.names[1], roomSettings.value.playerB.changeCardCount);
      layoutRef.value?.hideAlert();
      countdownRef.value?.start();
    });
  });
};
const stopGame = () => {
  const checked = ref<1 | 0 | -1>(-1);
  ElMessageBox({
    title: "还没有人获胜，现在结束比赛请选择一个选项",
    message: () =>
      h(
        ElRadioGroup,
        {
          modelValue: checked.value,
          "onUpdate:modelValue": (val: any) => {
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
        gameStore.stopGame(-1);
      } else {
        gameStore.stopGame(checked.value);
      }
    })
    .catch(() => {});
};
const pauseGame = () => {
  gameStore.pause(true);
};
const resumeGame = () => {
  gameStore.pause(false);
};
const confirmWinner = () => {
  gameStore.stopGame(winFlag.value < 0 ? 0 : 1).then(() => {
    winFlag.value = 0;
    countdownRef.value?.stop();
  });
};
const confirmSelect = () => {
  gameStore.selectSpell(selectedSpellIndex.value).then(() => {
    selectedSpellIndex.value = -1;
  });
};
const confirmAttained = () => {
  gameStore.finishSpell(selectedSpellIndex.value);
};
const warnPlayer = (name) => {
  return ws.send(WebSocketActionType.GM_WARN_PLAYER, { name });
};

const onCountDownComplete = () => {
  if (gameStore.gameStatus === GameStatus.COUNT_DOWN) {
    countdownRef.value?.start();
    gameStore.gameStatus = GameStatus.STARTED;
  } else if (gameStore.gameStatus === GameStatus.STARTED) {
    gameStore.gameStatus = GameStatus.ENDED;
  }
};
const resetRoom = () => {
  ElMessageBox.confirm("该操作会把房间回复到初始状态，是否确认？", "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      gameStore.resetRoom();
    })
    .catch(() => {});
};
const addChangeCardCount = (index: number) => {
  roomStore.updateChangeCardCount(roomData.value.names[index], roomData.value.change_card_count[index] + 1);
};
const removeChangeCardCount = (index: number) => {
  roomStore.updateChangeCardCount(roomData.value.names[index], roomData.value.change_card_count[index] - 1);
};
const playerBanPick = () => {
  gameStore.banPickCard(bpCode.value || "");
};
const confirmOpenEX = (flag: boolean) => {
  if (flag) {
    gameStore.banPickCard("1");
  } else {
    gameStore.banPickCard("-1");
  }
};
onMounted(() => {
  cardCount.value = roomData.value.change_card_count;
  if (!inGame.value) {
    if (soloMode.value) {
      layoutRef.value?.showAlert("等待左侧玩家开始比赛", "#000");
    } else {
      layoutRef.value?.showAlert("等待房主开始比赛", "#000");
    }
  }
});
// watch(gameData, (newVal, oldVal) => {
//   if (newVal.start_time) {
//     // const isStandByPhase = GameTime.main <= 0;
//     // if (isStandByPhase) {
//     //   nextTick(() => {
//     //     countdownRef.value?.start();
//     //   });
//     //   store.commit("clear_ban_pick_info");
//     // } else {
//     //   if (isHost.value && newVal.phase < 2) {
//     //     store.dispatch("set_phase", { phase: 2 });
//     //   }
//     //   nextTick(() => {
//     //     countdownRef.value?.start();
//     //     if (newVal.pause_begin_ms) {
//     //       countdownRef.value?.pause();
//     //     }
//     //   });
//     // }
//   } else {
//     store.commit("change_game_state", false);
//   }
//   if (newVal.phase === 2 && oldVal.phase === 1 && !isHost.value) {
//     store.dispatch("get_spells");
//   }
//   const status = newVal.status;
//   if (status && status.length) {
//     const available: number[] = new Array(12).fill(2);
//     const sumArr: number[] = new Array(12).fill(0);
//     winFlag.value = 0;
//     let countA = 0;
//     let countB = 0;
//     let scoreA = 0;
//     let scoreB = 0;
//     status.forEach((item: number, index: number) => {
//       const rowIndex = Math.floor(index / 5);
//       const columnIndex = index % 5;
//       if (item === 5) {
//         countA++;
//         scoreA += 1;
//         if (available[rowIndex] > 0) available[rowIndex] -= 2;
//         if (available[columnIndex + 5] > 0) available[columnIndex + 5] -= 2;
//         sumArr[rowIndex] -= 1;
//         sumArr[columnIndex + 5] -= 1;
//         if (index % 6 === 0) {
//           sumArr[10] -= 1;
//           if (available[10] > 0) available[10] -= 2;
//         }
//         if (index && index !== 24 && index % 4 === 0) {
//           sumArr[11] -= 1;
//           if (available[11] > 0) available[11] -= 2;
//         }
//       } else if (item === 7) {
//         countB++;
//         scoreB += 1;
//         if (available[rowIndex] % 2 === 0) available[rowIndex] -= 1;
//         if (available[columnIndex + 5] % 2 === 0) available[columnIndex + 5] -= 1;
//         sumArr[rowIndex] += 1;
//         sumArr[columnIndex + 5] += 1;
//         if (index % 6 === 0) {
//           sumArr[10] += 1;
//           if (available[10] % 2 === 0) available[10] -= 1;
//         }
//         if (index && index !== 24 && index % 4 === 0) {
//           sumArr[11] += 1;
//           if (available[11] % 2 === 0) available[11] -= 1;
//         }
//       }
//     });
//     let gamePointFlag = false;
//     for (let i = 0; i < 12; i++) {
//       if (sumArr[i] === -5) {
//         winFlag.value = -(i + 1);
//         break;
//       } else if (sumArr[i] === 5) {
//         winFlag.value = i + 1;
//         break;
//       } else if (
//         (sumArr[i] === -4 && oldSumArr.value[i] > -4 && isPlayerB.value) ||
//         (sumArr[i] === 4 && oldSumArr.value[i] < 4 && isPlayerA.value)
//       ) {
//         gamePointFlag = true;
//       }
//     }
//     if (gamePointFlag) {
//       Mit.emit("game_point");
//     }
//     oldSumArr.value = sumArr;
//     playerAScore.value = scoreA;
//     playerBScore.value = scoreB;
//     if (countA >= 13) {
//       winFlag.value = -13;
//     }
//     if (countB >= 13) {
//       winFlag.value = 13;
//     }
//     if (winFlag.value !== 0) {
//       if (soloMode.value && isPlayerA.value) {
//         confirmWinner();
//       }
//       if (!soloMode.value) {
//         layoutRef.value?.showAlert("已满足胜利条件，等待房主判断", "red");
//       }
//     }
//   }
// });
// watch(roomData, (newVal, oldVal) => {
//   if (newVal.winner !== undefined) {
//     ElMessageBox.alert(`${roomData.value.names[newVal.winner]}获胜`, "比赛结束", {
//       confirmButtonText: "确定",
//     });
//     delete newVal.winner;
//   }
//   cardCount.value = newVal.change_card_count;
//   if (!newVal.started && banPickInfo.value.phase !== 9999) {
//     layoutRef.value?.showAlert("等待房主开始比赛", "#000");
//   }
// });
// watch(inGame, (newVal, oldVal) => {
//   if (!newVal) {
//     if (soloMode.value) {
//       layoutRef.value?.showAlert("等待左侧玩家开始比赛", "#000");
//     } else {
//       layoutRef.value?.showAlert("等待房主开始比赛", "#000");
//     }
//   } else {
//     layoutRef.value?.hideAlert();
//   }
// });
// watch(gamePaused, (newVal, oldVal) => {
//   if (newVal) {
//     layoutRef.value?.showAlert("游戏已暂停", "#000");
//     countdownRef.value?.pause();
//   } else {
//     layoutRef.value?.hideAlert();
//     countdownRef.value?.start();
//   }
// });
// watch(isBpPhase, (newVal) => {
//   if (newVal) {
//     layoutRef.value?.hideAlert();
//   }
// });
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
