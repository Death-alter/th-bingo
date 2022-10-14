<template>
  <div class="count-down">
    <template v-if="seconds >= 3600">
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
      value: 0,
      hour: 0,
      minute: 0,
      second: 0,
    };
  },
  props: {
    seconds: {
      type: Number,
      default: 60,
    },
  },
  watch: {
    seconds: {
      handler(value) {
        this.value = value;
        this.pause();
        this.$emit("reset");
      },
      immediate: true,
    },
    value: {
      handler(value) {
        if (value <= 0) {
          return;
        }

        this.second = value % 60;

        if (this.seconds >= 3600) {
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
      if (!this.timer) {
        this.timer = window.setInterval(() => {
          this.value--;
          if (this.value === 0) {
            this.stop();
            this.$emit("complete");
          }
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
    },
    reset() {
      this.stop();
      this.value = this.seconds;
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
