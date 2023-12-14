<template>
  <div class="bingo-effect">
    <konva-stage ref="stageRef" :config="stageConfig">
      <konva-layer ref="layerRef"></konva-layer>
    </konva-stage>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import Konva from "konva";

export default defineComponent({
  name: "BingoEffect",
  setup() {
    const stageConfig = { width: 300, height: 300 };
    const stageNode = ref<HTMLElement>();
    const layerNode = ref<HTMLElement>();
    const stageRef = ref();
    const layerRef = ref();

    onMounted(() => {
      stageNode.value = stageRef.value.getNode();
      layerNode.value = layerRef.value.getNode();
    });

    return {
      stageConfig,
      stageNode,
      layerNode,
      stageRef,
      layerRef,
    };
  },
});
</script>

<style lang="scss" scoped>
.bingo-effect {
  width: 100%;
  height: 100%;
}
.effect-canvas {
  width: 100%;
  height: 100%;
}
</style>
