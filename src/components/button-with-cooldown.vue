<template>
  <el-button type="primary" :disabled="disabled || locked">{{ label }}</el-button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElButton } from "element-plus";

export default defineComponent({
  name: "ButtonWithCooldown",
  data() {
    return {
      timer: 0,
      label: "",
      locked: false,
    };
  },
  components: {
    ElButton,
  },
  props: {
    disabled: {
      type: Boolean,
    },
    cooldown: {
      type: Number,
      default: 0,
    },
    text: {
      type: String,
      default: "",
    },
    startTime: {
      type: Number,
    },
    immediate: {
      type: Boolean,
      default: true,
    },
  },
  mounted() {
    this.label = this.text;
    if (this.immediate) {
      this.cooling();
    }
  },
  unmounted() {
    this.locked = false;
  },
  methods: {
    cooling() {
      if (this.cooldown > 0) {
        let second: number;
        if (this.startTime == null) {
          second = this.cooldown;
        } else {
          const time = new Date().getTime() + this.$store.getters.heartBeat.timeMistake - this.startTime;
          second = this.cooldown - Math.floor(time / 1000);
          if (second < 0) second = 0;
        }
        if (second > 0) {
          this.locked = true;
          this.label = `${second}秒后可` + this.text;
          if (this.timer) window.clearInterval(this.timer);
          this.timer = window.setInterval(() => {
            if (!this.startTime) {
              --second;
            } else {
              const time = new Date().getTime() + this.$store.getters.heartBeat.timeMistake - this.startTime;
              second = this.cooldown - Math.floor(time / 1000);
            }
            if (second <= 0) {
              this.label = this.text;
              window.clearInterval(this.timer);
              this.timer = 0;
              this.locked = false;
            } else {
              this.label = `${second}秒后可` + this.text;
            }
          }, 1000);
        }
      }
    },
  },
});
</script>
