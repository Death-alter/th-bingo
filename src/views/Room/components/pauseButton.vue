<template>
  <el-button size="small" :disabled="!inGame" v-if="gamePaused" @click="resumeGame"> 继续比赛 </el-button>
  <el-button size="small" :disabled="!inGame" v-else @click="pauseGame">暂停比赛</el-button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useGameStore } from "@/store/GameStore";
import { useRoomStore } from "@/store/RoomStore";
import { GameStatus } from "@/types";
import { ElButton } from "element-plus";

const gameStore = useGameStore();
const roomStore = useRoomStore();
const inGame = computed(() => roomStore.inGame);
const gamePaused = computed(() => gameStore.gameStatus === GameStatus.PAUSED);

const pauseGame = () => {
  gameStore.pause(true).catch((e) => {});
};
const resumeGame = () => {
  gameStore.pause(false).catch((e) => {});
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
