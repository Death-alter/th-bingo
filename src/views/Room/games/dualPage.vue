<template>
  <room-layout
    ref="layoutRef"
    v-model="selectedSpellIndex"
    :validOperations="validOperations"
    :multiple="gameStore.gameStatus !== GameStatus.COUNT_DOWN"
  >
    <template #left>
      <div
        :class="{ 'page-icon': playerAPage === 0, 'page-icon-reverse': playerAPage === 1 }"
        @click="gameStore.switchPageLocal(playerAPage)"
      ></div>
      <score-board
        class="change-card"
        :size="48"
        :manual="soloMode ? isPlayerA : isHost"
        label="换卡次数"
        v-model="roomData.change_card_count[0]"
        @add="addChangeCardCount(0)"
        @minus="removeChangeCardCount(0)"
        :disabled="!inGame"
      ></score-board>
      <score-board
        class="spell-card-score-card"
        :size="30"
        label="得分"
        v-model="playerAScore"
        @click="gameStore.switchPageLocal(playerBPage)"
      ></score-board>
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
      <div
        :class="{ 'page-icon': playerBPage === 0, 'page-icon-reverse': playerBPage === 1 }"
        @click="gameStore.switchPageLocal(playerBPage)"
      ></div>
      <score-board
        class="change-card"
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
      <div :class="{ page: page === 0, 'page-reverse': page === 1 }"></div>
    </template>

    <template #widget>
      <count-down ref="countdownRef" :size="30" @complete="onCountDownComplete" v-show="inGame"></count-down>
    </template>

    <template #button-center>
      <owner-button :win-flag="winFlag" v-if="isOwner" @finish="winFlag = 0" />
      <template v-if="isPlayer && inGame">
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
      <switch-button v-if="isWatcher" />
    </template>

    <template #button-left-1>
      <template v-if="!soloMode && isHost">
        <reset-button :disabled="inGame" v-if="!inGame" />
        <pause-button :disabled="!inGame" v-else />
      </template>
      <side-button-solo v-if="soloMode && isPlayerA" />
    </template>

    <template #button-right-1>
      <switch-button v-if="(isHost || inGame) && !isWatcher" />
    </template>
  </room-layout>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { GameStatus, MenuOperationType, SpellStatus } from "@/types";
import RoomLayout from "../components/roomLayout.vue";
import ScoreBoard from "@/components/score-board.vue";
import CountDown from "@/components/count-down.vue";
import PauseButton from "../components/pauseButton.vue";
import ResetButton from "../components/resetButton.vue";
import OwnerButton from "../components/ownerButton.vue";
import SideButtonSolo from "../components/sideButtonSolo.vue";
import SwitchButton from "../components/switchButton.vue";
import ConfirmSelectButton from "@/components/button-with-cooldown.vue";
import { ElButton } from "element-plus";
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
const soloMode = computed(() => roomStore.soloMode);
const isHost = computed(() => roomStore.isHost);
const isPlayer = computed(() => roomStore.isPlayer);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const isOwner = computed(() => (soloMode.value ? isPlayerA.value : isHost.value));
const isWatcher = computed(() => roomStore.isWatcher);
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
const inGame = computed(() => roomStore.inGame);
const page = computed(() => gameStore.page);

const validOperations = computed(() =>
  soloMode.value || isHost.value ? [MenuOperationType.SET_NONE, MenuOperationType.SELECT, MenuOperationType.ATTAIN] : []
);

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
    }
  },
  {
    immediate: true,
  }
);

const playerAPage = computed(() => gameStore.playerAPage);
const playerBPage = computed(() => gameStore.playerBPage);
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

const decideDualPage = (status: string[]) => {
  const available: number[] = new Array(12).fill(2);
  const sumArr: number[] = new Array(12).fill(0);
  winFlag.value = 0;
  let countA = 0;
  let countB = 0;
  let scoreA = 0;
  let scoreB = 0;
  status.forEach((item: string, index: number) => {
    const rowIndex = Math.floor(index / 5);
    const columnIndex = index % 5;
    if (item[1] === SpellStatus.ATTAINED) {
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
    }
    if (item[3] === SpellStatus.ATTAINED) {
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
  }
};

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
        nextTick(() => {
          countdownRef.value?.start();
        });
        break;
      case GameStatus.ENDED:
        layoutRef.value?.showAlert("比赛已结束，等待房主操作", "red");
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
      decideDualPage(status);
    }
  },
  { deep: true, immediate: true }
);

const confirmWinner = () => {
  gameStore.stopGame(winFlag.value < 0 ? 0 : 1).then(() => {
    countdownRef.value?.stop();
    winFlag.value = 0;
  });
};
const warnPlayer = (name) => {
  return ws.send(WebSocketActionType.GM_WARN_PLAYER, { name });
};
const onCountDownComplete = () => {
  if (gameStore.gameStatus === GameStatus.COUNT_DOWN) {
    gameStore.gameStatus = GameStatus.STARTED;
    gameStore.leftTime = roomConfig.value.game_time * 1000 * 60;
  } else if (gameStore.gameStatus === GameStatus.STARTED) {
    gameStore.gameStatus = GameStatus.ENDED;
    if (!isHost.value) layoutRef.value?.showAlert("游戏时间到，等待房主判断胜负", "red");
  }
};
const addChangeCardCount = (index: number) => {
  roomStore.updateChangeCardCount(roomData.value.names[index], roomData.value.change_card_count[index] + 1);
};
const removeChangeCardCount = (index: number) => {
  roomStore.updateChangeCardCount(roomData.value.names[index], roomData.value.change_card_count[index] - 1);
};
const confirmSelect = () => {
  switchToSelfPage();
  gameStore.alreadySelectCard = true;
  gameStore.selectSpell(selectedSpellIndex.value).then(() => {
    selectedSpellIndex.value = -1;
  });
};
const confirmAttained = () => {
  switchToSelfPage();
  gameStore.finishSpell(isPlayerA.value ? playerASelectedIndex.value : playerBSelectedIndex.value);
};
const switchToSelfPage = () => {
  gameStore.switchPageLocal(
    isPlayerA.value
      ? gameStore.dualPageGameData.player_current_page[0]
      : gameStore.dualPageGameData.player_current_page[1]
  );
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

.page-icon {
  width: 20px;
  height: 20px;
  border: 1px solid #000;
  background-color: var(--bg-color);
  cursor: pointer;
}

.page-icon-reverse {
  width: 20px;
  height: 20px;
  border: 1px solid #000;
  background-color: var(--bg-color-reverse);
  cursor: pointer;
}

.page {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  pointer-events: none;
  background: linear-gradient(90deg, transparent 95%, var(--bg-color)),
    linear-gradient(180deg, transparent 95%, var(--bg-color)), linear-gradient(270deg, transparent 95%, var(--bg-color)),
    linear-gradient(360deg, transparent 95%, var(--bg-color));
}

.page-reverse {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  pointer-events: none;
  background: linear-gradient(90deg, transparent 95%, var(--bg-color-reverse)),
    linear-gradient(180deg, transparent 95%, var(--bg-color-reverse)),
    linear-gradient(270deg, transparent 95%, var(--bg-color-reverse)),
    linear-gradient(360deg, transparent 95%, var(--bg-color-reverse));
}
</style>
