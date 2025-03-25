<template>
  <el-button type="primary" :disabled="disabled || locked">{{ label }}</el-button>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { ElButton } from "element-plus";
import { useLocalStore } from "@/store/LocalStore";

const localStore = useLocalStore();

const timer = ref(0);
const label = ref("");
const locked = ref(false);

const props = withDefaults(
  defineProps<{
    disabled: boolean;
    cooldown: number;
    text: string;
    startTime: number;
    immediate: boolean;
  }>(),
  {
    disabled: false,
    cooldown: 0,
    text: "",
    startTime: 0,
    immediate: true,
  }
);

onMounted(() => {
  label.value = props.text;
  if (props.immediate) {
    cooling();
  }
});

onUnmounted(() => {
  locked.value = false;
});

const cooling = () => {
  if (props.cooldown > 0) {
    let second: number;
    if (props.startTime == null) {
      second = props.cooldown;
    } else {
      const time = new Date().getTime() + localStore.timeMistake - props.startTime;
      second = props.cooldown - Math.floor(time / 1000);
      if (second < 0) second = 0;
    }
    if (second > 0) {
      locked.value = true;
      label.value = `${second}秒后可` + props.text;
      if (timer.value) window.clearInterval(timer.value);
      timer.value = window.setInterval(() => {
        if (!props.startTime) {
          --second;
        } else {
          const time = new Date().getTime() + localStore.timeMistake - props.startTime;
          second = props.cooldown - Math.floor(time / 1000);
        }
        if (second <= 0) {
          label.value = props.text;
          window.clearInterval(timer.value);
          timer.value = 0;
          locked.value = false;
        } else {
          label.value = `${second}秒后可` + props.text;
        }
      }, 1000);
    }
  }
};
</script>
