<template>
  <reset-button :disabled="inGame" v-if="!inGame" />
  <el-button :disabled="!inGame" v-else size="small" @click="stopGame">结束比赛</el-button>
</template>

<script lang="ts" setup>
import { useRoomStore } from "@/store/RoomStore";
import { useGameStore } from "@/store/GameStore";
import { ElMessageBox, ElRadio, ElRadioGroup, ElButton } from "element-plus";
import { computed, ref, h } from "vue";
import ResetButton from "../components/resetButton.vue";

const roomStore = useRoomStore();
const gameStore = useGameStore();
const inGame = computed(() => roomStore.inGame);
const roomData = computed(() => roomStore.roomData);

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
