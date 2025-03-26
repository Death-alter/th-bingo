<template>
  <div
    class="count-down"
    :style="{
      'font-size': size + 'px',
    }"
  >
    <template v-if="gameStore.leftTime >= 3600000">
      <div class="hour">{{ format(hour) }}</div>
      <div class="colon">:</div>
    </template>
    <div class="minute">{{ format(minute) }}</div>
    <div class="colon">:</div>
    <div class="second">{{ format(second) }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useGameStore } from "@/store/GameStore";
import { GameStatus } from "@/types";

const gameStore = useGameStore();

const props = withDefaults(
  defineProps<{
    mode?: "countdown" | "stopwatch"; //countdown为倒计时模式，stopwatch为秒表模式。秒表模式仅link赛使用
    size?: number;
  }>(),
  {
    mode: "countdown",
    size: 14,
  }
);

const emits = defineEmits(["complete"]);

const timer = ref(0);
const hour = ref(0);
const minute = ref(0);
const second = ref(0);

const start = () => {
  if (timer.value) {
    window.clearInterval(timer.value);
    timer.value = 0;
  }
  if (props.mode === "countdown") {
    if (gameStore.gameStatus !== GameStatus.PAUSED) {
      timer.value = window.setInterval(() => {
        gameStore.leftTime -= 1000;
        if (gameStore.leftTime <= 0) {
          stop();
          emits("complete");
        }
      }, 1000);
    }
  } else if (props.mode === "stopwatch") {
    // remaining.value = GameTime.main;
    // timer.value = window.setInterval(() => {
    //   remaining.value = GameTime.main;
    //   if (remaining.value <= 0) {
    //     stop();
    //     emits("complete");
    //   }
    // }, 1000);
  }
};
const pause = () => {
  if (timer.value) {
    window.clearInterval(timer.value);
    timer.value = 0;
  }
};
const stop = () => {
  pause();
  hour.value = 0;
  minute.value = 0;
  second.value = 0;
  gameStore.leftTime = 0;
};
const format = (number: number): string => {
  return number < 10 ? `0${number}` : "" + number;
};

watch(
  () => gameStore.leftTime,
  (value) => {
    if (value < 0) {
      second.value = 0;
      minute.value = 0;
      hour.value = 0;
      return;
    }
    value = Math.ceil(value / 1000);
    second.value = value % 60;
    if (value >= 3600000) {
      hour.value = Math.floor(value / 3600);
      minute.value = Math.floor(value / 60) % 60;
    } else {
      minute.value = Math.floor(value / 60);
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.count-down {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .colon {
    margin: 0 10px;
  }
}
</style>
