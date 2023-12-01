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

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { Minus, Plus } from "@element-plus/icons-vue";
import { ElButton } from "element-plus";

export default defineComponent({
  name: "ScoreBoard",
  components: { ElButton },
  props: {
    modelValue: {
      type: Number,
      default: 0,
    },
    label: {
      type: String,
      default: "得分",
    },
    max: {
      type: Number,
    },
    min: {
      type: Number,
      default: 0,
    },
    manual: {
      type: Boolean,
      default: false,
    },
    step: {
      type: Number,
      default: 1,
    },
    size: {
      type: Number,
      default: 14,
    },
    textSize: {
      type: Number,
      default: 12,
    },
  },
  emits: ["update:modelValue", "add", "minus"],
  setup(props, context) {
    const score = ref(0);

    watch(
      () => props.modelValue,
      (value) => {
        score.value = value;
      },
      { immediate: true }
    );

    const addScore = () => {
      if (!props.manual) {
        score.value += props.step;
        if (props.max != null && score.value > props.max) {
          score.value = props.max;
        }
        context.emit("update:modelValue", score.value);
      } else {
        context.emit("add");
      }
    };
    const minusScore = () => {
      if (!props.manual) {
        score.value -= props.step;
        if (props.min != null && score.value < props.min) {
          score.value = props.min;
        }
        context.emit("update:modelValue", score.value);
      } else {
        context.emit("minus");
      }
    };

    return {
      score,
      Minus,
      Plus,
      addScore,
      minusScore,
    };
  },
});
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
