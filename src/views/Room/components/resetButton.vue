<template>
  <el-button size="small" :disabled="inGame" @click="resetRoom">重置房间</el-button>
</template>

<script lang="ts" setup>
import { useRoomStore } from "@/store/RoomStore";
import { ElMessageBox, ElButton } from "element-plus";
import { computed } from "vue";

const roomStore = useRoomStore();
const inGame = computed(() => roomStore.inGame);

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
