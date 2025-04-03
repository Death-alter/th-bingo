<template>
  <div v-if="visible" class="game-alert">
    <div :style="{ color: alertColor }">{{ alertText }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const visible = defineModel<boolean>({ default: false });

const alertColor = ref("#000");
const alertText = ref("");

const show = (text?: string, color?: string) => {
  if (text) alertText.value = text;
  if (color) alertColor.value = color;
  visible.value = true;
};

const hide = () => {
  visible.value = false;
};

defineExpose({ show, hide });
</script>

<style lang="scss" scoped>
.game-alert {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0;
  top: 0;
  background-color: #ffffffcc;
  z-index: 100;
}
</style>
