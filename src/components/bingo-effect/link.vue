<template>
  <div class="bingo-effect" ref="wrap">
    <konva-stage ref="stage" :config="stageConfig">
      <konva-layer ref="layer"></konva-layer>
    </konva-stage>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { useStore } from "vuex";
import Konva from "konva";

export default defineComponent({
  name: "BingoEffect",
  data() {
    return {
      width: 0 as number,
      height: 0 as number,
      listA: [0] as number[],
      listB: [4] as number[],
      stageNode: null as any,
      layerNode: null as any,
    };
  },
  setup() {
    const wrap = ref();
    const stage = ref();
    const layer = ref();
    const lineA = ref<Konva.Line | null>();
    const lineB = ref<Konva.Line | null>();
    const store = useStore();

    watch(
      () => store.getters.roomSettings.playerA.color,
      (value) => {
        lineA.value?.stroke(value);
        lineA.value?.draw();
      }
    );

    watch(
      () => store.getters.roomSettings.playerB.color,
      (value) => {
        lineB.value?.stroke(value);
        lineB.value?.draw();
      }
    );

    return {
      wrap,
      stage,
      layer,
      lineA,
      lineB,
      roomSettings: computed(() => store.getters.roomSettings),
    };
  },
  props: {
    routeA: {
      type: Array,
      required: true,
    },
    routeB: {
      type: Array,
      required: true,
    },
  },
  watch: {
    routeA(value) {
      this.listA = value;
      this.drawLine("A");
    },
    routeB(value) {
      this.listB = value;
      this.drawLine("B");
    },
  },
  computed: {
    stageConfig(): any {
      return { width: this.width, height: this.height };
    },
  },
  mounted() {
    this.stageNode = this.stage.getNode();
    this.layerNode = this.layer.getNode();
    this.width = this.wrap.offsetWidth;
    this.height = this.wrap.offsetHeight;
    const AStart = this.getCenterPosition(0);
    const BStart = this.getCenterPosition(4);
    this.lineA = new Konva.Line({
      points: [AStart.x, AStart.y, AStart.x, AStart.y],
      stroke: this.roomSettings.playerA.color,
      strokeWidth: 8,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.6,
      closed: false,
    });
    this.lineB = new Konva.Line({
      points: [BStart.x, BStart.y, BStart.x, BStart.y],
      stroke: this.roomSettings.playerB.color,
      strokeWidth: 8,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.6,
      closed: false,
    });
    this.layerNode.add(this.lineA);
    this.layerNode.add(this.lineB);
  },
  methods: {
    drawLine(tag: string) {
      const listName = "list" + tag;
      const lineArr = [];
      if (this[listName].length === 1) {
        const position = this.getCenterPosition(this[listName][0]);
        lineArr.push(position.x);
        lineArr.push(position.y);
        lineArr.push(position.x);
        lineArr.push(position.y);
      } else {
        for (let item of this[listName]) {
          const position = this.getCenterPosition(item);
          lineArr.push(position.x);
          lineArr.push(position.y);
        }
      }
      this["line" + tag].points(lineArr);
      // this["line" + tag].draw();
    },
    getCenterPosition(index: number) {
      const cellWidth = this.width / 5;
      const cellHeight = this.height / 5;
      const r = index % 5;
      const c = Math.floor(index / 5);
      return {
        x: (r + 0.5) * cellWidth,
        y: (c + 0.5) * cellHeight,
      };
    },
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
