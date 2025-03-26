<template>
  <div class="game-bp">
    <template v-if="phase < 99">
      <div class="game-list selectable">
        <div
          :class="{
            'game-item': true,
            'current-select-A': isPlayerA && modelValue === game.code,
            'current-select-B': isPlayerB && modelValue === game.code,
            'A-selected': ASelectedList.includes(game.code),
            'B-selected': BSelectedList.includes(game.code),
            banned: ABannedList.includes(game.code) || BBannedList.includes(game.code),
          }"
          v-for="(game, index) in gameList"
          :key="index"
          @click="selectGame(game.code)"
        >
          <img class="game-icon" :src="getGameIcon(game.code)" alt="" />
        </div>
        <div
          v-if="phase < 3"
          :class="{
            'game-item': true,
            'current-select-A': isPlayerA && modelValue === 'EX',
            'current-select-B': isPlayerB && modelValue === 'EX',
          }"
          @click="selectGame('EX')"
        >
          <img class="game-icon" :src="getGameIcon('EX')" alt="" />
        </div>
      </div>
      <div class="tooltip-text">{{ tooltipText }}</div>
      <el-row style="width: 100%; margin-top: 10px">
        <el-col :span="12">
          <div class="title">选择作品</div>
          <div class="selected-game-list A-selected">
            <div class="game-item" v-for="(game, index) in ASelectedList" :key="index">
              {{ game === "EX" ? game : `TH${game}` }}
            </div>
          </div>
          <div class="title">禁用作品</div>
          <div class="selected-game-list banned">
            <div class="game-item" v-for="(game, index) in ABannedList" :key="index">
              {{ game === "EX" ? game : `TH${game}` }}
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="title">选择作品</div>
          <div class="selected-game-list B-selected">
            <div class="game-item" v-for="(game, index) in BSelectedList" :key="index">
              {{ game === "EX" ? game : `TH${game}` }}
            </div>
          </div>
          <div class="title">禁用作品</div>
          <div class="selected-game-list banned">
            <div class="game-item" v-for="(game, index) in BBannedList" :key="index">
              {{ game === "EX" ? game : `TH${game}` }}
            </div>
          </div>
        </el-col>
      </el-row>
    </template>
    <template v-else>
      <div class="top-text">PB已经结束，本局可能出现以下作品</div>
      <div class="game-list">
        <div class="game-item" v-for="(game, index) in roomConfig.games" :key="index">TH{{ game }}</div>
        <div v-if="openEX" class="game-item">EX</div>
      </div>
      <div class="bottom-text">{{ isHost ? "请抽取符卡" : "请等待房主抽取符卡" }}</div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import Config from "@/config";
import { ElRow, ElCol } from "element-plus";
import { BpStatus } from "@/types";
import { useGameStore } from "@/store/GameStore";
import { useRoomStore } from "@/store/RoomStore";

const gameStore = useGameStore();
const roomStore = useRoomStore();

const code = defineModel();
const gameList = ref([...Config.gameOptionList]);
const ASelectedList = computed(() => gameStore.banPick.a_pick);
const BSelectedList = computed(() => gameStore.banPick.b_pick);
const ABannedList = computed(() => gameStore.banPick.a_ban);
const BBannedList = computed(() => gameStore.banPick.b_ban);

const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const roomConfig = computed(() => roomStore.roomConfig);
const phase = computed(() => gameStore.phase);
const openEX = computed(() => gameStore.banPick.a_open_ex === 1 && gameStore.banPick.b_open_ex === 1);
const isHost = computed(() => roomStore.isHost);
const bpStatus = computed(() => gameStore.bpStatus);
const tooltipText = computed(() => {
  switch (bpStatus.value) {
    case BpStatus.IS_A_PICK:
      if (isHost.value) {
        return "等待左侧玩家选择一个作品";
      }
      if (isPlayerA.value) {
        return "请选择一个作品";
      }
      if (isPlayerB.value) {
        return "等待对手选择一个作品";
      }
      break;
    case BpStatus.IS_B_PICK:
      if (isHost.value) {
        return "等待右侧玩家选择一个作品";
      }
      if (isPlayerA.value) {
        return "等待对手选择一个作品";
      }
      if (isPlayerB.value) {
        return "请选择一个作品";
      }
      break;
    case BpStatus.IS_A_BAN:
      if (isHost.value) {
        return "等待左侧玩家禁用一个作品";
      }
      if (isPlayerA.value) {
        return "请禁用一个作品";
      }
      if (isPlayerB.value) {
        return "等待对手禁用一个作品";
      }
      break;
    case BpStatus.IS_B_BAN:
      if (isHost.value) {
        return "等待右侧玩家禁用一个作品";
      }
      if (isPlayerA.value) {
        return "等待对手禁用一个作品";
      }
      if (isPlayerB.value) {
        return "请禁用一个作品";
      }
      break;
    case BpStatus.SELECT_OPEN_EX:
      if (isHost.value) {
        return "等待玩家选择是否开启EX";
      }
      if (isPlayerA.value || isPlayerB.value) {
        return "请选择是否开启EX";
      }
  }
  return "";
});

const selectGame = (c: string) => {
  if (phase.value > 99) return;
  const list = [...ASelectedList.value, ...BSelectedList.value, ...ABannedList.value, ...BBannedList.value];
  if (list.includes(c)) return;
  if (code.value) {
    code.value = "";
  } else {
    code.value = c;
  }
};

const getGameIcon = (code: string) => {
  if (code === "EX") {
    return require("@/assets/image/game/ex.png");
  } else {
    if (code.length === 1) code = "0" + code;
    return require(`@/assets/image/game/th${code}.png`);
  }
};
</script>

<style lang="scss" scoped>
.game-bp {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: auto;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;

  .game-list {
    margin-top: 20px;
    width: 480px;
    height: 228px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;

    &.selectable {
      .game-item {
        cursor: pointer;
      }
    }
  }

  .game-item {
    width: 48px;
    height: 48px;
    border: 4px solid #000;
    margin: 10px 20px;
    line-height: 48px;

    user-select: none;
    font-size: 18px;

    &.A-selected {
      color: var(--A-color);
      border-color: var(--A-color);
      cursor: not-allowed;
    }

    &.B-selected {
      color: var(--B-color);
      border-color: var(--B-color);
      cursor: not-allowed;
    }
    &.A-selected.B-selected {
      border-image: linear-gradient(to right, var(--A-color), var(--B-color)) 4;
      background-image: linear-gradient(to right, var(--A-color), var(--B-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &.banned {
      color: gray;
      border-color: gray;
      opacity: 0.5;
      cursor: not-allowed;
      position: relative;
    }

    &.banned::after {
      display: block;
      content: "";
      width: 70px;
      height: 4px;
      background-color: gray;
      transform: rotate(45deg);
      transform-origin: top left;
      position: absolute;
      left: 0px;
      top: -3px;
    }

    &.current-select-A {
      box-shadow: 0 0 4px 2px var(--A-color);
    }

    &.current-select-B {
      box-shadow: 0 0 4px 2px var(--B-color);
    }
  }

  .title {
    font-weight: 600;
  }

  .selected-game-list {
    display: flex;
    justify-content: center;
    height: 76px;

    &.A-selected {
      .game-item {
        color: var(--A-color);
        border-color: var(--A-color);
      }
    }

    &.B-selected {
      .game-item {
        color: var(--B-color);
        border-color: var(--B-color);
      }
    }

    &.banned {
      .game-item {
        color: gray;
        border-color: gray;
      }
    }
  }

  .tooltip-text {
    height: 30px;
    line-height: 30px;
  }

  .top-text {
    font-size: 20px;
    font-weight: 600;
    margin-top: 30px;
  }

  .bottom-text {
    margin-top: 50px;
  }
}
</style>
