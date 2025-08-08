<template>
  <div class="room">
    <room-layout ref="layoutRef" v-model="selectedSpellIndex" :validOperations="validOperations">
      <template #left>
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

      <template #widget>
        <count-down
          ref="countdownRef"
          :size="30"
          @complete="onCountDownComplete"
          v-show="gameStore.gameStatus === GameStatus.COUNT_DOWN"
        ></count-down>
      </template>

      <template #button-center>
        <owner-button :win-flag="winFlag" v-if="isOwner" />
        <template v-if="isPlayer && inGame">
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
      </template>

      <template #button-left-1>
        <template v-if="!soloMode && isHost">
          <reset-button :disabled="inGame" v-if="!inGame" />
          <pause-button :disabled="!inGame" v-else />
        </template>
        <side-button-solo v-if="soloMode && isPlayerA" />
      </template>

      <template #button-right-1>
        <template v-if="isOwner">
          <el-button size="small" @click="nextRound" :disabled="!inGame || gameStore.bpGameData.ban_pick !== 2"
            >进入下轮</el-button
          >
        </template>
      </template>
    </room-layout>
  </div>
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
const roomConfig = computed(() => roomStore.roomConfig);
const soloMode = computed(() => roomStore.soloMode);
const isHost = computed(() => roomStore.isHost);
const isPlayer = computed(() => roomStore.isPlayer);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const isOwner = computed(() => (soloMode.value ? isPlayerA.value : isHost.value));

const validOperations = computed(() =>
  soloMode.value || isHost.value
    ? [
        MenuOperationType.BAN,
        MenuOperationType.ATTAINED_FAIL,
        MenuOperationType.SET_NONE,
        MenuOperationType.SELECT,
        MenuOperationType.ATTAIN,
      ]
    : []
);

const inGame = computed(() => roomStore.inGame);
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
      nextTick(() => {
        countdownRef.value?.start();
      });
    }
  },
  {
    immediate: true,
  }
);

const playerAScore = ref(0);
const playerBScore = ref(0);
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
const decideBp = (status: string[]) => {
  const available: number[] = new Array(12).fill(2);
  const sumArr: number[] = new Array(12).fill(0);
  winFlag.value = 0;
  let count = 0;
  let scoreA = 0;
  let scoreB = 0;
  status.forEach((item: string, index: number) => {
    const rowIndex = Math.floor(index / 5);
    const columnIndex = index % 5;
    if (item[1] === SpellStatus.BANNED) {
      count++;
    }
    if (item[1] === SpellStatus.ATTAINED) {
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
    }
    if (item[3] === SpellStatus.ATTAINED) {
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
    decideBp(status);
  },
  { deep: true, immediate: true }
);

const warnPlayer = (name) => {
  return ws.send(WebSocketActionType.GM_WARN_PLAYER, { name });
};
const onCountDownComplete = () => {
  if (gameStore.gameStatus === GameStatus.COUNT_DOWN) {
    gameStore.gameStatus = GameStatus.STARTED;
    gameStore.leftTime = roomConfig.value.game_time * 1000 * 60;
    nextTick(() => {
      countdownRef.value?.start();
    });
  } else if (gameStore.gameStatus === GameStatus.STARTED) {
    gameStore.gameStatus = GameStatus.ENDED;
    if (!isHost.value) layoutRef.value?.showAlert("游戏时间到，等待房主判断胜负", "red");
  }
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
