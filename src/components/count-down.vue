<template>
  <div class="count-down">
    <template v-if="modelValue >= 3600">
      <div class="hour">{{ format(hour) }}</div>
      <div class="colon">:</div>
    </template>
    <div class="minute">{{ format(minute) }}</div>
    <div class="colon">:</div>
    <div class="second">{{ format(second) }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CountDown",
  data() {
    return {
      timer: 0,
      hour: 0,
      minute: 0,
      second: 0,
    };
  },
  props: {
    modelValue: {
      type: Number,
      default: 60,
    },
    mode: {
      type: String,
      default: "countdown",
    },
  },
  emits: ["update:modelValue", "complete"],
  watch: {
    modelValue: {
      handler(value) {
        if (value < 0) {
          return;
        }
        this.second = value % 60;
        if (this.modelValue >= 3600) {
          this.hour = Math.floor(value / 3600);
          this.minute = Math.floor(value / 60) % 60;
        } else {
          this.minute = Math.floor(value / 60);
        }
      },
      immediate: true,
    },
  },
  methods: {
    start() {
      if (this.timer) {
        window.clearInterval(this.timer);
        this.timer = 0;
      }
      if (this.mode === "countdown") {
        this.timer = window.setInterval(() => {
          this.$emit("update:modelValue", this.modelValue - 1);
          if (this.modelValue === 0) {
            this.stop();
            this.$emit("complete");
          }
        }, 1000);
      } else if (this.mode === "stopwatch") {
        this.timer = window.setInterval(() => {
          this.$emit("update:modelValue", this.modelValue + 1);
        }, 1000);
      }
    },
    pause() {
      if (this.timer) {
        window.clearInterval(this.timer);
        this.timer = 0;
      }
    },
    stop() {
      this.pause();
      this.hour = 0;
      this.minute = 0;
      this.second = 0;
      this.$emit("update:modelValue", 0);
    },
    format(number: number): string {
      return number < 10 ? `0${number}` : "" + number;
    },
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
