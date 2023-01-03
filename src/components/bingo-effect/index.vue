<template>
  <div class="bingo-effect">
    <konva-stage ref="stage" :config="stageConfig">
      <konva-layer ref="layer"></konva-layer>
    </konva-stage>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import Konva from "konva";

export default defineComponent({
  name: "BingoEffect",
  data() {
    return {
      stageConfig: { width: 300, height: 300 },
      stageNode: null as any,
      layerNode: null as any,
    };
  },
  setup() {
    const stage = ref();
    const layer = ref();

    return {
      stage,
      layer,
    };
  },
  mounted() {
    this.stageNode = this.stage.getNode();
    this.layerNode = this.layer.getNode();
  },
  methods: {
    link() {},
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
