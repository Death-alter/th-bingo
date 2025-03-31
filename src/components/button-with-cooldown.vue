<template>
  <el-button type="primary" :disabled="disabled || locked">{{ label }}</el-button>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ElButton } from "element-plus";

const enum ButtonStatus {
  BEFORE_COOLING = 0,
  IS_COOLING = 1,
  COOLING_PAUSED = 2,
  AFTER_COOLING = 3,
}

const timer = ref(0);
const locked = ref(false);
const status = ref<ButtonStatus>(ButtonStatus.BEFORE_COOLING);
const leftTime = ref(0);

const label = computed(() =>
  status.value === ButtonStatus.IS_COOLING || status.value === ButtonStatus.COOLING_PAUSED
    ? `${Math.ceil(leftTime.value / 1000)}秒后可` + props.text
    : props.text
);

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    cooldown: number;
    text?: string;
    immediate?: boolean;
    paused?: boolean;
  }>(),
  {
    disabled: false,
    cooldown: -1,
    text: "",
    immediate: false,
    paused: false,
  }
);

const emits = defineEmits(["finish"]);

onMounted(() => {
  if (props.paused) {
    leftTime.value = props.cooldown;
    if (leftTime.value > 0) {
      locked.value = true;
      status.value = ButtonStatus.COOLING_PAUSED;
    }
  } else {
    if (props.immediate) {
      startCooling();
    }
  }
  if (props.cooldown <= 0) {
    emits("finish");
  }
});

watch(
  () => props.paused,
  (paused) => {
    if (paused) {
      puaseCooling();
    } else {
      resumeCooling();
    }
  }
);

onUnmounted(() => {
  locked.value = false;
  status.value = ButtonStatus.BEFORE_COOLING;
});

const coolingCallback = () => {
  leftTime.value -= 1000;
  if (leftTime.value <= 0) {
    window.clearInterval(timer.value);
    timer.value = 0;
    leftTime.value = 0;
    locked.value = false;
    status.value = ButtonStatus.AFTER_COOLING;
    emits("finish");
  }
};

const startCooling = () => {
  if (status.value === ButtonStatus.BEFORE_COOLING && props.cooldown > 0) {
    leftTime.value = props.cooldown;
    if (leftTime.value > 0) {
      locked.value = true;
      status.value = ButtonStatus.IS_COOLING;
      if (timer.value) window.clearInterval(timer.value);
      timer.value = window.setInterval(coolingCallback, 1000);
    }
  }
};

const stopCooling = () => {
  puaseCooling();
  locked.value = false;
  status.value = ButtonStatus.AFTER_COOLING;
};

const puaseCooling = () => {
  clearInterval(timer.value);
  timer.value = 0;
};

const resumeCooling = () => {
  if (timer.value) window.clearInterval(timer.value);
  timer.value = window.setInterval(coolingCallback, 1000);
};

const reset = () => {
  status.value = ButtonStatus.BEFORE_COOLING;
  locked.value = false;
};

defineExpose({ startCooling, stopCooling, puaseCooling, resumeCooling, reset });
</script>
