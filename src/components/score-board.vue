<template>
  <div class="score-board">
    <div class="score-board-number">
      <div class="score-board-number-btn" v-if="manual">
        <el-button
          :style="{
            'font-size': `${Math.floor(size / 2)}px`,
          }"
          type="primary"
          link
          :icon="Minus"
          @click="minusScore"
          :disabled="min != null && score <= min"
        />
      </div>
      <div
        class="score-board-number-info"
        :style="{
          'font-size': size + 'px',
        }"
      >
        {{ score }}
      </div>
      <div class="score-board-number-btn" v-if="manual">
        <el-button
          :style="{
            'font-size': `${Math.floor(size / 2)}px`,
          }"
          type="primary"
          link
          :icon="Plus"
          @click="addScore"
          :disabled="max != null && score >= max"
        />
      </div>
    </div>
    <div
      class="score-board-text"
      :style="{
        'font-size': textSize + 'px',
      }"
    >
      <slot>
        {{ label }}
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Minus, Plus } from "@element-plus/icons-vue";
import { ElButton } from "element-plus";

const score = defineModel<number>({ default: 0, required: true });
const props = withDefaults(
  defineProps<{
    label: string;
    max: number;
    min: number;
    manual: boolean;
    step: number;
    size: number;
    textSize: number;
  }>(),
  {
    label: "得分",
    min: 0,
    manual: false,
    step: 1,
    size: 14,
    textSize: 12,
  }
);
const emits = defineEmits(["add", "minus"]);

const addScore = () => {
  if (!props.manual) {
    let v = score.value;
    v += props.step;
    if (props.max != null && score.value > props.max) {
      v = props.max;
    }
    score.value = v;
  } else {
    emits("add");
  }
};
const minusScore = () => {
  if (!props.manual) {
    let v = score.value;
    v -= props.step;
    if (props.min != null && score.value < props.min) {
      v = props.min;
    }
    score.value = v;
  } else {
    emits("minus");
  }
};
</script>

<style lang="scss" scoped>
.score-board {
  width: 100%;
  .score-board-number {
    display: flex;
    justify-content: center;
    align-items: center;

    .score-board-number-info {
      margin: 0 15px;
    }
  }
}
</style>
