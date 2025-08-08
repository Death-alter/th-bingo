<template>
  <div class="room">
    <BingoStandard v-if="isBingoStandard" />
    <BingoBp v-if="isBingoBp" />
    <BingoDualPage v-if="isBingoDuelPage" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { BingoType } from "@/types";
import BingoStandard from "./games/standard.vue";
import BingoBp from "./games/bp.vue";
import BingoDualPage from "./games/dualPage.vue";
import { useRoomStore } from "@/store/RoomStore";

const roomStore = useRoomStore();

const isBingoStandard = computed(() => roomStore.roomData.type === BingoType.STANDARD);
const isBingoBp = computed(() => roomStore.roomData.type === BingoType.BP);
const isBingoLink = computed(() => roomStore.roomData.type === BingoType.LINK);
const isBingoDuelPage = computed(() => roomStore.roomData.type === BingoType.DUAL_PAGE);
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
