<template>
  <div class="room">
    <room-layout
      ref="layoutRef"
      v-model="selectedSpellIndex"
      :menu="menu"
      :multiple="isBingoBp || (isBingoStandard && gameStore.gameStatus === GameStatus.COUNT_DOWN)"
    >
      <template #left>
        <score-board
          class="change-card"
          v-if="isBingoStandard"
          :size="48"
          :manual="soloMode ? isPlayerA : isHost"
          label="换卡次数"
          v-model="roomData.change_card_count[0]"
          @add="addChangeCardCount(0)"
          @minus="removeChangeCardCount(0)"
          :disabled="!inGame"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分" v-model="playerAScore"></score-board>
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
          v-model="roomData.change_card_count[1]"
          @add="addChangeCardCount(1)"
          @minus="removeChangeCardCount(1)"
          :disabled="!inGame"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分" v-model="playerBScore"></score-board>
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

      <template #extra>
        <!-- <div class="bingo-effect" v-if="isBingoLink">
          <bingo-link-effect :route-a="routeA" :route-b="routeB" />
        </div> -->
        <game-bp v-if="isBpPhase" v-model="bpCode"></game-bp>
      </template>

      <template #widget>
        <count-down
          ref="countdownRef"
          :size="30"
          @complete="onCountDownComplete"
          v-show="(isBingoStandard && inGame) || (isBingoBp && gameStore.gameStatus === GameStatus.COUNT_DOWN)"
        ></count-down>
      </template>

      <template #button-center>
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

        <template v-if="soloMode && isPlayerA">
          <el-button type="primary" v-if="!inGame && !isBpPhase" @click="startGame">开始比赛</el-button>
          <el-button type="primary" v-if="banPick.phase === 9999" @click="drawSpellCard">抽取符卡</el-button>
        </template>

        <template v-if="isPlayer">
          <template v-if="inGame">
            <template v-if="isBingoStandard">
              <confirm-select-button
                @click="confirmSelect"
                :disabled="selectedSpellIndex < 0 || gamePaused"
                v-if="!spellCardSelected"
                :cooldown="selectCooldown"
                :immediate="gameStore.gameStatus === GameStatus.STARTED && !gameStore.spellCardGrabbedFlag"
                :paused="gamePaused"
                @finish="setCdTime"
                text="选择符卡"
              ></confirm-select-button>
              <confirm-select-button
                @click="confirmAttained"
                v-if="spellCardSelected"
                :disabled="gameStore.gameStatus !== GameStatus.STARTED"
                :cooldown="roomSettings.confirmDelay * 1000"
                :immediate="gameStore.alreadySelectCard"
                text="确认收取"
              ></confirm-select-button>
            </template>
            <template v-if="isBingoBp">
              <el-button
                type="primary"
                @click="confirmBp"
                :disabled="!isMyTurn || !bingoBpPhase || selectedSpellIndex < 0"
                v-if="!gameStore.bpGameData.ban_pick"
                >{{ bingoBpPhase ? (isMyTurn ? "选择符卡" : "等待对手选择符卡") : "等待房主操作" }}</el-button
              >
              <el-button
                type="primary"
                @click="confirmBp"
                v-if="gameStore.bpGameData.ban_pick"
                :disabled="!isMyTurn || !bingoBpPhase || selectedSpellIndex < 0"
                >{{ bingoBpPhase ? (isMyTurn ? "禁用符卡" : "等待对手禁用符卡") : "等待房主操作" }}</el-button
              >
            </template>
            <!-- <template v-if="isBingoLink">
              <el-button
                type="primary"
                @click="confirmSelect"
                :disabled="gamePaused || !routeComplete"
                v-if="(gamePhase === 1 || !confirmed) && !(gamePhase > 1 && routeComplete)"
                >{{ confirmed ? "取消确认" : "确认路线" }}</el-button
              >
            </template> -->
          </template>

          <template v-if="isBpPhase">
            <el-button
              type="primary"
              v-if="banPick.phase < 11"
              :disabled="!(isPlayerA && playerACanBP) && !(isPlayerB && playerBCanBP)"
              @click="playerBanPick"
              >确定</el-button
            >
            <el-button type="primary" v-if="banPick.phase === 11" @click="confirmOpenEX(true)">开启</el-button>
            <el-button type="primary" v-if="banPick.phase === 11" @click="confirmOpenEX(false)">不开启</el-button>
          </template>
        </template>

        <!-- <template v-if="isBingoLink">
          <el-button type="primary" v-if="!inGame">开始比赛</el-button>
          <el-button type="primary" v-else>结束比赛</el-button>
        </template> -->
      </template>

      <template #button-left-1>
        <template v-if="!soloMode && isHost">
          <template v-if="isBingoStandard || !inGame">
            <el-button size="small" :disabled="inGame" @click="resetRoom">重置房间</el-button>
          </template>
          <template v-else>
            <el-button size="small" :disabled="!inGame" v-if="gamePaused" @click="resumeGame"> 继续比赛 </el-button>
            <el-button size="small" :disabled="!inGame" v-else @click="pauseGame">暂停比赛</el-button>
          </template>
        </template>
        <template v-if="soloMode && isPlayerA">
          <el-button v-if="isPlayerA && !inGame" size="small" @click="resetRoom">重置房间</el-button>
          <el-button v-if="isPlayerA && inGame" size="small" @click="stopGame">结束比赛</el-button>
        </template>
      </template>

      <template #button-right-1>
        <template v-if="isOwner">
          <template v-if="isBingoStandard">
            <template v-if="!isBpPhase">
              <el-button size="small" :disabled="!inGame" v-if="gamePaused" @click="resumeGame"> 继续比赛 </el-button>
              <el-button size="small" :disabled="!inGame" v-else @click="pauseGame">暂停比赛</el-button>
            </template>
            <el-button :disabled="bpStatus !== 5" size="small" v-else @click="startBP">重新BP</el-button>
          </template>
          <template v-if="isBingoBp">
            <el-button size="small" @click="nextRound" :disabled="!inGame || gameStore.bpGameData.ban_pick !== 2"
              >进入下轮</el-button
            >
          </template>
          <!-- <template v-if="isBingoLink">
            <el-button size="small" @click="linkTiming" :disabled="gamePhase < 2 || gamePhase > 3 || gamePaused">{{
              gamePhase === 3 && !gameData.link_data.start_ms_b ? "开始计时" : "结束计时"
            }}</el-button>
          </template> -->
        </template>
      </template>
    </room-layout>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, computed, watch, nextTick, onMounted } from "vue";
import { BingoType, BpStatus, GameStatus } from "@/types";
import RoomLayout from "./components/roomLayout.vue";
import ScoreBoard from "@/components/score-board.vue";
import CountDown from "@/components/count-down.vue";
import GameBp from "@/components/game-bp.vue";
import ConfirmSelectButton from "@/components/button-with-cooldown.vue";
import { ElButton, ElMessageBox, ElRadioGroup, ElRadio } from "element-plus";
import ws from "@/utils/webSocket/WebSocketBingo";
import { useRoomStore } from "@/store/RoomStore";
import { useGameStore } from "@/store/GameStore";
import { WebSocketActionType } from "@/utils/webSocket/types";

const roomStore = useRoomStore();
const gameStore = useGameStore();

const countdownRef = ref<InstanceType<typeof CountDown>>();
const layoutRef = ref<InstanceType<typeof RoomLayout>>();

const selectedSpellIndex = ref(-1);
const winFlag = ref(0);

const roomData = computed(() => roomStore.roomData);
const roomSettings = computed(() => roomStore.roomSettings);
const roomConfig = computed(() => roomStore.roomConfig);
const soloMode = computed(() => {
  return roomStore.soloMode;
});
const isHost = computed(() => roomStore.isHost);
const isPlayer = computed(() => roomStore.isPlayer);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const isOwner = computed(() => (soloMode.value ? isPlayerA.value : isHost.value));

const inMatch = computed(() => roomStore.inMatch);
const isBingoStandard = computed(() => roomStore.roomData.type === BingoType.STANDARD);
const isBingoBp = computed(() => roomStore.roomData.type === BingoType.BP);
const isBingoLink = computed(() => roomStore.roomData.type === BingoType.LINK);

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
const spellCardSelected = computed(() => {
  if (isPlayerA.value) {
    return playerASelectedIndex.value !== -1;
  }
  if (isPlayerB.value) {
    return playerBSelectedIndex.value !== -1;
  }
  return false;
});
const menu = computed<{ label: string; value: number; tag?: string; isReset?: boolean }[]>(() => {
  let data: { label: string; value: number; tag?: string; isReset?: boolean }[] = [];
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
      if (isHost.value) {
        data = [
          {
            label: "收取失败",
            value: 0,
            isReset: false,
          },
          {
            label: "禁用",
            value: -1,
          },
          {
            label: "置空",
            value: 0,
            isReset: true,
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
          // {
          //   label: "两侧玩家选择",
          //   value: 2,
          // },
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
      break;
    case BingoType.LINK:
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
          ];
        }
      }
      break;
  }
  return data;
});

const inGame = computed(() => roomStore.inGame);
onMounted(() => {
  if (!inGame.value) {
    if (soloMode.value) {
      if (!isBpPhase.value) layoutRef.value?.showAlert("等待左侧玩家开始比赛", "#000");
    } else {
      if (!isBpPhase.value) layoutRef.value?.showAlert("等待房主开始比赛", "#000");
    }
  } else {
    layoutRef.value?.hideAlert();
  }
});
const isBpPhase = computed(
  () => roomStore.banPick.phase > 0 && (roomStore.banPick.phase < 99 || gameStore.gameStatus === GameStatus.NOT_STARTED)
);
watch(
  isBpPhase,
  (value) => {
    if (value) {
      layoutRef.value?.hideAlert();
    }
  },
  {
    immediate: true,
  }
);
watch([inGame, isBpPhase], ([inGame, isBpPhase]) => {
  if (!inGame && !isBpPhase) {
    if (soloMode.value) {
      layoutRef.value?.showAlert("等待左侧玩家开始比赛", "#000");
    } else {
      layoutRef.value?.showAlert("等待房主开始比赛", "#000");
    }
  } else {
    layoutRef.value?.hideAlert();
  }
});

const gamePaused = computed(() => gameStore.gameStatus === GameStatus.PAUSED);
onMounted(() => {
  if (gamePaused.value) {
    layoutRef.value?.showAlert("游戏已暂停", "#000");
    countdownRef.value?.pause();
  }
});
watch(
  gamePaused,
  (value) => {
    if (value) {
      layoutRef.value?.showAlert("游戏已暂停", "#000");
      countdownRef.value?.pause();
    } else {
      layoutRef.value?.hideAlert();
      if (!isBingoBp.value) {
        nextTick(() => {
          countdownRef.value?.start();
        });
      }
    }
  },
  {
    immediate: true,
  }
);

//赛前BP
const bpCode = ref("");
const banPick = computed(() => roomStore.banPick);
const bpStatus = computed(() => roomStore.bpStatus);

const startBP = () => {
  roomStore.startBanPick();
};
const playerBanPick = () => {
  if (!bpCode.value) {
    ElMessageBox.confirm("你没有选择作品，是否确认不选择？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        roomStore.banPickCard("");
      })
      .catch(() => {});
  } else {
    roomStore.banPickCard(bpCode.value);
  }
};
const confirmOpenEX = (flag: boolean) => {
  if (flag) {
    roomStore.banPickCard("1");
  } else {
    roomStore.banPickCard("-1");
  }
};

//标准赛
const oldSumArr = ref<number[]>([]);
const playerAScore = ref(0);
const playerBScore = ref(0);
const selectCooldown = computed(() => {
  if (!gameStore.inited) {
    return -1;
  }
  const c = gameStore.leftCdTime < 0 ? roomConfig.value.cd_time * 1000 : gameStore.leftCdTime;
  return c;
});

const setCdTime = () => {
  gameStore.leftCdTime = -1;
};
const decideStandard = (status) => {
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
    layoutRef.value?.warnGamePoint();
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

  if (soloMode.value && isPlayerA.value && winFlag.value !== 0) {
    // if (trainingMode.value) Mit.emit("ai_game_over");
    confirmWinner();
  }
  if (!soloMode.value && !isHost.value) {
    if (winFlag.value !== 0) {
      layoutRef.value?.showAlert("已满足胜利条件，等待房主判断胜负", "red");
    } else {
      layoutRef.value?.hideAlert();
    }
  }

  if (gameStore.leftTime < 0 && countA !== countB) {
    if (countA > countB) {
      winFlag.value = -14;
    } else {
      winFlag.value = 14;
    }
    // if (trainingMode.value) Mit.emit("ai_game_over");
  }
};

//BP赛
const isMyTurn = computed(
  () =>
    (isPlayerA.value && gameStore.bpGameData.whose_turn === 0) ||
    (isPlayerB.value && gameStore.bpGameData.whose_turn === 1)
);
const bingoBpPhase = computed(() => gameStore.bpGameData.ban_pick !== 2);

const nextRound = () => {
  gameStore.bpGameNextRound();
};
const confirmBp = () => {
  if (selectedSpellIndex.value === -1) return;
  gameStore.bpGameBanPick(selectedSpellIndex.value).then(() => {
    selectedSpellIndex.value = -1;
  });
};
const decideBp = (status) => {
  const available: number[] = new Array(12).fill(2);
  const sumArr: number[] = new Array(12).fill(0);
  winFlag.value = 0;
  let count = 0;
  let scoreA = 0;
  let scoreB = 0;
  status.forEach((item: number, index: number) => {
    const rowIndex = Math.floor(index / 5);
    const columnIndex = index % 5;
    if (item == -1) {
      count++;
    }
    if (item === 5) {
      count++;
      scoreA += gameStore.spells[index].star;
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
      count++;
      scoreB += gameStore.spells[index].star;
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
      winFlag.value = -(i + 1);
      break;
    } else if (sumArr[i] === 5) {
      winFlag.value = i + 1;
      break;
    }
  }

  playerAScore.value = scoreA;
  playerBScore.value = scoreB;

  if (count == 25) {
    if (scoreB - scoreA < 0) {
      winFlag.value = -25;
    } else {
      winFlag.value = 25;
    }
  }

  if (!isHost.value) {
    if (winFlag.value !== 0) {
      layoutRef.value?.showAlert("已满足胜利条件，等待房主判断胜负", "red");
    } else {
      layoutRef.value?.hideAlert();
    }
  }
};

//link赛
// const routeA = ref([]);
// const routeB = ref([]);

watch(
  () => gameStore.gameStatus,
  (newVal, oldVal) => {
    switch (newVal) {
      case GameStatus.NOT_STARTED:
        playerAScore.value = 0;
        playerBScore.value = 0;
        break;
      case GameStatus.COUNT_DOWN:
        nextTick(() => {
          countdownRef.value?.start();
        });
        break;
      case GameStatus.STARTED:
        if (!isBingoBp.value) {
          nextTick(() => {
            countdownRef.value?.start();
          });
        }
        break;
      case GameStatus.PAUSED:
        break;
      case GameStatus.ENDED:
        layoutRef.value?.showAlert("比赛已结束，等待房主操作", "red");
        // ElMessageBox.alert(`${roomData.value.last_winner}获胜`, "比赛结束", {
        //   confirmButtonText: "确定",
        // });
        // roomStore.roomData.change_card_count = [0, 0];
        break;
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => gameStore.spellStatus,
  (status) => {
    if (status && status.length) {
      if (isBingoStandard.value) {
        decideStandard(status);
      }
      if (isBingoBp.value) {
        decideBp(status);
      }
    }

    // if (isBingoLink.value) {
    //   winFlag.value = 0;
    //   if (newVal.link_data) {
    //     decideLink(newVal);
    //   }
    // }
  },
  { deep: true, immediate: true }
);

//方法
const startGame = () => {
  if (roomSettings.value.gamebp && (!roomSettings.value.matchbp || !inMatch.value)) {
    startBP();
  } else {
    gameStore.startGame().then(() => {
      roomStore.updateChangeCardCount(roomData.value.names[0], roomSettings.value.playerA.changeCardCount);
      roomStore.updateChangeCardCount(roomData.value.names[1], roomSettings.value.playerB.changeCardCount);
      layoutRef.value?.hideAlert();
    });
  }
};
const drawSpellCard = () => {
  gameStore.startGame().then(() => {
    roomStore.updateChangeCardCount(roomData.value.names[0], roomSettings.value.playerA.changeCardCount);
    roomStore.updateChangeCardCount(roomData.value.names[1], roomSettings.value.playerB.changeCardCount);
    layoutRef.value?.hideAlert();
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
              value: -1,
            },
            {
              default: () => "结果作废",
            }
          ),
          h(
            ElRadio,
            {
              value: 0,
            },
            {
              default: () => roomData.value.names[0] + "获胜",
            }
          ),
          h(
            ElRadio,
            {
              value: 1,
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
    countdownRef.value?.stop();
    winFlag.value = 0;
  });
};
const confirmSelect = () => {
  gameStore.alreadySelectCard = true;
  gameStore.selectSpell(selectedSpellIndex.value).then(() => {
    selectedSpellIndex.value = -1;
  });
};
const confirmAttained = () => {
  gameStore.finishSpell(isPlayerA.value ? playerASelectedIndex.value : playerBSelectedIndex.value);
};
const warnPlayer = (name) => {
  return ws.send(WebSocketActionType.GM_WARN_PLAYER, { name });
};
const onCountDownComplete = () => {
  if (gameStore.gameStatus === GameStatus.COUNT_DOWN) {
    gameStore.gameStatus = GameStatus.STARTED;
    gameStore.leftTime = roomConfig.value.game_time * 1000 * 60;
    if (!isBingoBp.value) {
      nextTick(() => {
        countdownRef.value?.start();
      });
    }
  } else if (gameStore.gameStatus === GameStatus.STARTED) {
    gameStore.gameStatus = GameStatus.ENDED;
    if (!isHost.value) layoutRef.value?.showAlert("游戏时间到，等待房主判断胜负", "red");
  }
};
const resetRoom = () => {
  ElMessageBox.confirm("该操作会把房间回复到初始状态，是否确认？", "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      roomStore.resetRoom();
    })
    .catch(() => {});
};
const addChangeCardCount = (index: number) => {
  roomStore.updateChangeCardCount(roomData.value.names[index], roomData.value.change_card_count[index] + 1);
};
const removeChangeCardCount = (index: number) => {
  roomStore.updateChangeCardCount(roomData.value.names[index], roomData.value.change_card_count[index] - 1);
};
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
