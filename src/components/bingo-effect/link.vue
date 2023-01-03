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
      points: [AStart.x, AStart.y],
      stroke: this.roomSettings.playerA.color,
      strokeWidth: 8,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.8,
      closed: false,
    });
    this.lineB = new Konva.Line({
      points: [BStart.x, BStart.y],
      stroke: this.roomSettings.playerB.color,
      strokeWidth: 8,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.8,
      closed: false,
    });
    this.layerNode.add(this.lineA);
    this.layerNode.add(this.lineB);
    this.link("A", 0);
    this.link("B", 4);
  },
  methods: {
    link(tag: string, index: number) {
      if (tag !== "A" && tag !== "B") return;
      const listName = "list" + tag;
      const length = this[listName].length;
      if (length > 1) {
        if (this[listName][length - 1] === index) {
          this[listName].pop();
        } else if (this[listName].indexOf(index) === -1) {
          this[listName].push(index);
        }
      } else {
        this[listName].push(index);
      }
      console.log(this[listName]);
      this.drawLine(tag);
    },
    drawLine(tag: string) {
      const listName = "list" + tag;
      const lineArr = [];
      for (let item of this[listName]) {
        const position = this.getCenterPosition(item);
        lineArr.push(position.x);
        lineArr.push(position.y);
      }
      this["line" + tag].points(lineArr);
      this["line" + tag].draw();
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
    getLinkList(tag: string) {
      return this["list" + tag];
    },
    setLinkList(tag: string, list: number[]) {
      this["list" + tag] = list;
      this.drawLine(tag);
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
