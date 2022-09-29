<template>
  <div class="bingo-effect">
    <canvas class="effect-canvas" ref="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import Effect from "./effect";

export default defineComponent({
  name: "BingoEffect",
  data() {
    return {
      effect: null as Effect | null,
    };
  },
  setup() {
    const canvas = ref();
    return { canvas };
  },
  mounted() {
    this.effect = new Effect({
      el: this.canvas,
    });
    console.log(this.effect);
  },
  methods: {},
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
