<template>
  <div
    class="count-down"
    :style="{
      'font-size': size + 'px',
    }"
  >
    <template v-if="remaining >= 3600000">
      <div class="hour">{{ format(hour) }}</div>
      <div class="colon">:</div>
    </template>
    <div class="minute">{{ format(minute) }}</div>
    <div class="colon">:</div>
    <div class="second">{{ format(second) }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import GameTime from "@/utils/GameTime";

export default defineComponent({
  name: "CountDown",
  props: {
    mode: {
      type: String,
      default: "countdown",
    },
    size: {
      type: Number,
      default: 14,
    },
  },
  emits: ["complete"],
  setup(props, context) {
    const timer = ref(0);
    const hour = ref(0);
    const minute = ref(0);
    const second = ref(0);
    const remaining = ref(0);

    const start = () => {
      if (timer.value) {
        window.clearInterval(timer.value);
        timer.value = 0;
      }
      if (props.mode === "countdown") {
        const isStandByPhase = GameTime.main <= 0;
        if (isStandByPhase) {
          remaining.value = GameTime.countdown - GameTime.standby;
          timer.value = window.setInterval(() => {
            remaining.value = GameTime.countdown - GameTime.standby;
            if (remaining.value <= 0) {
              stop();
              context.emit("complete");
            }
          }, 1000);
        } else {
          remaining.value = GameTime.duration - GameTime.main;
          timer.value = window.setInterval(() => {
            remaining.value = GameTime.duration - GameTime.main;
            if (remaining.value <= 0) {
              stop();
              context.emit("complete");
            }
          }, 1000);
        }
      } else if (props.mode === "stopwatch") {
        remaining.value = GameTime.main;
        timer.value = window.setInterval(() => {
          remaining.value = GameTime.main;
          if (remaining.value <= 0) {
            stop();
            context.emit("complete");
          }
        }, 1000);
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
      remaining.value = 0;
    };
    const format = (number: number): string => {
      return number < 10 ? `0${number}` : "" + number;
    };

    watch(
      remaining,
      (value) => {
        if (value < 0) {
          return;
        }
        value = Math.ceil(value / 1000);
        second.value = value % 60;
        if (remaining.value >= 3600000) {
          hour.value = Math.floor(value / 3600);
          minute.value = Math.floor(value / 60) % 60;
        } else {
          minute.value = Math.floor(value / 60);
        }
      },
      { immediate: true }
    );
    return {
      timer,
      hour,
      minute,
      second,
      remaining,
      start,
      pause,
      stop,
      format,
    };
  },
});
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
