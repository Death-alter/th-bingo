<template>
  <el-button type="primary" :disabled="disabled || locked">{{ label }}</el-button>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { ElButton } from "element-plus";

const timer = ref(0);
const label = ref("");
const locked = ref(false);

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    cooldown: number;
    text?: string;
    immediate?: boolean;
  }>(),
  {
    disabled: false,
    cooldown: 0,
    text: "",
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
    let cooldown = props.cooldown;
    if (cooldown > 0) {
      locked.value = true;
      label.value = `${Math.ceil(cooldown / 1000)}秒后可` + props.text;
      if (timer.value) window.clearInterval(timer.value);
      timer.value = window.setInterval(() => {
        cooldown = cooldown -= 1000;
        if (cooldown <= 0) {
          label.value = props.text;
          window.clearInterval(timer.value);
          timer.value = 0;
          locked.value = false;
        } else {
          label.value = `${Math.ceil(cooldown / 1000)}秒后可` + props.text;
        }
      }, 1000);
    }
  }
};
</script>
