<template>
  <div :class="cellClass" @click="onClick">
    <div class="spell-card-info">
      <div class="level" v-if="level">
        <div class="level-icons" :class="levelClass">
          <el-icon v-for="(item, index) in new Array(level)" :key="index"><StarFilled /></el-icon>
        </div>
      </div>
      <div class="desc">
        {{ desc }}
      </div>
      <div class="name">{{ name }}</div>
      <div class="fail-count-a" v-if="failCountA && status < 5">失败：{{ failCountA }}</div>
      <div class="fail-count-b" v-if="failCountB && status < 5">失败：{{ failCountB }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { ElIcon } from "element-plus";
import { SpellStatus } from "@/types";
import { useRoomStore } from "@/store/RoomStore";

const roomStore = useRoomStore();

const props = withDefaults(
  defineProps<{
    level?: number;
    name?: string;
    disabled?: boolean;
    status?: number;
    selected?: boolean;
    desc?: string;
    failCountA?: number;
    failCountB?: number;
  }>(),
  {
    level: 0,
    name: "",
    disabled: false,
    status: 0,
    selected: false,
    desc: "",
    failCountA: 0,
    failCountB: 0,
  }
);

const emits = defineEmits(["click"]);

const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const cellClass = computed(() => ({
  "spell-card-cell": true,
  banned: props.status === SpellStatus.BANNED,
  "A-selected": props.status === SpellStatus.A_SELECTED || props.status === SpellStatus.BOTH_SELECTED,
  "A-attained": props.status === SpellStatus.A_ATTAINED || props.status === SpellStatus.BOTH_ATTAINED,
  "B-selected": props.status === SpellStatus.B_SELECTED || props.status === SpellStatus.BOTH_SELECTED,
  "B-attained": props.status === SpellStatus.B_ATTAINED || props.status === SpellStatus.BOTH_ATTAINED,
  "A-local-selected": props.selected && isPlayerA.value && props.status != SpellStatus.BOTH_HIDDEN,
  "B-local-selected": props.selected && isPlayerB.value && props.status != SpellStatus.BOTH_HIDDEN,
  "Hidden": props.status == SpellStatus.BOTH_HIDDEN,
  "A-see-only": props.status == SpellStatus.LEFT_SEE_ONLY,
  "B-see-only": props.status == SpellStatus.RIGHT_SEE_ONLY,
  "Hidden-A-local-select": props.selected && isPlayerA.value && props.status == SpellStatus.BOTH_HIDDEN,
  "Hidden-B-local-select": props.selected && isPlayerB.value && props.status == SpellStatus.BOTH_HIDDEN,
}));
const levelClass = computed(() => `level${props.level}`);

const onClick = () => {
  if (!props.disabled) {
    emits("click");
  }
};
</script>

<style lang="scss" scoped>
.spell-card-cell {
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
  padding: 4px;
  cursor: pointer;
  user-select: none;
  z-index: 1;
  overflow: hidden;

  .spell-card-info {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;

    .level {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      .level1 {
        color: rgb(223, 233, 36);
      }

      .level2 {
        color: rgb(214, 181, 31);
      }

      .level3 {
        color: rgb(212, 124, 9);
      }

      .level4 {
        color: rgb(213, 86, 18);
      }

      .level5 {
        color: red;
      }
    }

    .desc {
      position: absolute;
      bottom: 0;
      right: 0;
      font-size: 12px;
    }

    .name {
      text-align: center;
      word-break: break-all;
      white-space: "pre-wrap";
      font-size: 14px;
    }

    .fail-count-a {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 12px;
      color: var(--A-color);
    }

    .fail-count-b {
      position: absolute;
      bottom: 0;
      left: 0;
      font-size: 12px;
      color: var(--B-color);
    }
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
  }

  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
  }

  &.A-selected {
    &::before {
      background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
      -webkit-animation: breath 3s infinite linear;
      animation: breath 3s infinite linear;
    }
  }

  &.B-selected {
    &::after {
      background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
      -webkit-animation: breath 3s infinite linear;
      animation: breath 3s infinite linear;
    }
  }

  &.A-selected.B-selected {
    &::before {
      transform: skew(-0.89rad) translateX(0%);
      left: -50%;
    }
    &::after {
      transform: skew(-0.89rad) translateX(0%);
      left: 50%;
    }
  }

  &.A-local-selected {
    &::before {
      background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
      opacity: 0.2;
    }
  }

  &.B-local-selected {
    &::after {
      background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
      opacity: 0.2;
    }
  }

  &.A-attained {
    &::before {
      background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
    }
  }

  &.B-attained {
    &::after {
      background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
    }
  }

  &.A-attained.B-attained {
    &::before {
      transform: skew(-0.89rad) translateX(0%);
      left: -50%;
    }
    &::after {
      transform: skew(-0.89rad) translateX(0%);
      left: 50%;
    }
  }

  &.banned {
    text-decoration: line-through;

    &::before {
      background-image: linear-gradient(#ccc 60%, #666);
    }

    .level-icons {
      color: #666 !important;
    }
  }

  &.Hidden {
    .spell-card-info > *:not(.level) { // 排除level容器（本身已隐藏）
      visibility: hidden;
    }
    .level-icons { // 单独处理星星图标
      visibility: hidden !important;
    }
  }

  &.Hidden-A-local-select{
    .spell-card-info > *:not(.level) { // 排除level容器（本身已隐藏）
      visibility: hidden;
    }
    .level-icons { // 单独处理星星图标
      visibility: hidden !important;
    }
    &::before {
      background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
      opacity: 0.2;
    }
  }

  &.Hidden-B-local-select{
    .spell-card-info > *:not(.level) { // 排除level容器（本身已隐藏）
      visibility: hidden;
    }
    .level-icons { // 单独处理星星图标
      visibility: hidden !important;
    }
    &::before {
      background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
      opacity: 0.2;
    }
  }

  &.A-see-only {
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 10%;
      height: 10%;
      background-color: var(--A-color);
      z-index: 2; // 覆盖在现有内容之上
      pointer-events: none;
      opacity: 0.5;
    }
  }

  &.B-see-only {
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 10%;
      height: 10%;
      background-color: var(--B-color);
      z-index: 2; // 覆盖在现有内容之上
      pointer-events: none;
      opacity: 0.5;
    }
  }
}
</style>
