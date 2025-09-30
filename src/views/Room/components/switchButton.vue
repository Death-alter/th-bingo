<template>
  <el-button size="small" :disabled="!inGame" @click="switchPage">切换盘面</el-button>
</template>

<script lang="ts" setup>
import { useGameStore } from "@/store/GameStore";
import { useRoomStore } from "@/store/RoomStore";
import { GameStatus } from "@/types";
import { ElButton } from "element-plus";
import { computed } from "vue";

const roomStore = useRoomStore();
const gameStore = useGameStore();
const inGame = computed(() => roomStore.inGame);
const isPlayer = computed(() => roomStore.isPlayer);

const switchPage = () => {
  if (inGame.value) {
    if (
      gameStore.gameStatus === GameStatus.COUNT_DOWN &&
      ((roomStore.isPlayerA && gameStore.playerASelectedIndex === -1) ||
        (roomStore.isPlayerB && gameStore.playerBSelectedIndex === -1))
    ) {
      gameStore.switchPage();
    } else {
      gameStore.switchPageLocal(1 - gameStore.page);
    }
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
