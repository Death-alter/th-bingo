<template>
  <div class="bingo-effect" ref="wrapRef">
    <konva-stage ref="stageRef" :config="stageConfig">
      <konva-layer ref="layerRef"></konva-layer>
    </konva-stage>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from "vue";
import { useStore } from "vuex";
import Konva from "konva";

export default defineComponent({
  name: "BingoEffect",
  props: {
    routeA: {
      type: Array as () => number[],
      required: true,
    },
    routeB: {
      type: Array as () => number[],
      required: true,
    },
  },
  setup(props, context) {
    const store = useStore();
    const wrapRef = ref();
    const stageRef = ref();
    const layerRef = ref();
    const lineA = ref<Konva.Line | null>();
    const lineB = ref<Konva.Line | null>();

    const stageConfig = reactive({
      width: 0,
      height: 0,
    });
    const listA = ref([0]);
    const listB = ref([4]);
    const stageNode = ref();
    const layerNode = ref();
    const roomSettings = computed(() => store.getters.roomSettings);

    const drawLine = (tag: string) => {
      const list = tag === "A" ? listA : listB;
      const lineArr: number[] = [];
      if (list.value.length === 1) {
        const position = getCenterPosition(list.value[0]);
        lineArr.push(position.x);
        lineArr.push(position.y);
        lineArr.push(position.x);
        lineArr.push(position.y);
      } else {
        for (let item of list.value) {
          const position = getCenterPosition(item);
          lineArr.push(position.x);
          lineArr.push(position.y);
        }
      }
      if (tag === "A") {
        lineA.value?.points(lineArr);
      } else {
        lineB.value?.points(lineArr);
      }
    };
    const getCenterPosition = (index: number) => {
      const cellWidth = stageConfig.width / 5;
      const cellHeight = stageConfig.height / 5;
      const r = index % 5;
      const c = Math.floor(index / 5);
      return {
        x: (r + 0.5) * cellWidth,
        y: (c + 0.5) * cellHeight,
      };
    };

    watch(
      () => props.routeA,
      (value) => {
        listA.value = value;
        drawLine("A");
      }
    );
    watch(
      () => props.routeB,
      (value) => {
        listB.value = value;
        drawLine("B");
      }
    );
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

    onMounted(() => {
      stageNode.value = stageRef.value.getNode();
      layerNode.value = layerRef.value.getNode();
      stageConfig.width = wrapRef.value.offsetWidth;
      stageConfig.height = wrapRef.value.offsetHeight;
      const AStart = getCenterPosition(0);
      const BStart = getCenterPosition(4);
      lineA.value = new Konva.Line({
        points: [AStart.x, AStart.y, AStart.x, AStart.y],
        stroke: roomSettings.value.playerA.color,
        strokeWidth: 8,
        lineCap: "round",
        lineJoin: "round",
        opacity: 0.6,
        closed: false,
      });
      lineB.value = new Konva.Line({
        points: [BStart.x, BStart.y, BStart.x, BStart.y],
        stroke: roomSettings.value.playerB.color,
        strokeWidth: 8,
        lineCap: "round",
        lineJoin: "round",
        opacity: 0.6,
        closed: false,
      });
      layerNode.value?.add(lineA.value);
      layerNode.value?.add(lineB.value);
    });

    return {
      wrapRef,
      stageRef,
      layerRef,
      lineA,
      lineB,
      stageConfig,
      listA,
      listB,
      stageNode,
      layerNode,
      roomSettings,
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
