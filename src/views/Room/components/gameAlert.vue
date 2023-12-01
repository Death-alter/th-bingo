<template>
  <div v-if="isShow" class="game-alert">
    <div :style="{ color: alertColor }">{{ alertText }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  name: "GameAlert",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  setup(props, context) {
    const isShow = ref(false);
    const alertColor = ref("#000");
    const alertText = ref("");

    watch(
      () => props.modelValue,
      (value) => {
        isShow.value = value;
      }
    );

    const show = (text?: string, color?: string) => {
      if (text) alertText.value = text;
      if (color) alertColor.value = color;
      isShow.value = true;
      context.emit("update:modelValue", true);
    };

    const hide = () => {
      isShow.value = false;
      context.emit("update:modelValue", false);
    };

    return {
      isShow,
      alertColor,
      alertText,
      show,
      hide,
    };
  },
});
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
