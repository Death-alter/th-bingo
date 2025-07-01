<template>
  <div :class="cellClass" @click="onClick">
    <div class="spell-card-info">
      <div class="level" v-if="level">
        <div class="level-icons" :class="levelClass">
          <el-icon v-for="(item, index) in new Array(level)" :key="index"><StarFilled /></el-icon>
        </div>
      </div>
      <div class="desc">
        <!-- 使用split方法截取破折号前的内容 -->
        {{ status === SpellStatus.ONLY_REVEAL_GAME ? (desc?.split('-')[0] || '') : desc }}
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
import { useGameStore } from "@/store/GameStore";

const roomStore = useRoomStore();
const gameStore = useGameStore();

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
    isPortalA?: boolean;
    isPortalB?: boolean;
    isACurrentBoard?: boolean;
    isBCurrentBoard?: boolean;
    spellIndex?: number;
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
    isPortalA: false,
    isPortalB: false,
    isACurrentBoard: true,
    isBCurrentBoard: false,
    spellIndex: -1,
  }
);

const emits = defineEmits(["click"]);

const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);

const playerAOnCurBoard = computed(() => roomStore.roomConfig.dual_board == 0 || isPlayerB.value ||
  gameStore.currentBoard == gameStore.normalGameData.which_board_a)
const playerBOnCurBoard = computed(() => roomStore.roomConfig.dual_board == 0 || isPlayerA.value ||
  gameStore.currentBoard == gameStore.normalGameData.which_board_b)
const playerAAttainOnCurBoard = computed(() => roomStore.roomConfig.dual_board == 0 || isPlayerB.value ||
  gameStore.normalGameData.get_on_which_board[props.spellIndex] == (1 << gameStore.currentBoard))
const playerBAttainOnCurBoard = computed(() => roomStore.roomConfig.dual_board == 0 || isPlayerA.value ||
  gameStore.normalGameData.get_on_which_board[props.spellIndex] == (0x10 << gameStore.currentBoard))

const cellClass = computed(() => ({
  "spell-card-cell": true,
  banned: props.status === SpellStatus.BANNED,
  "A-selected": props.status === SpellStatus.A_SELECTED || props.status === SpellStatus.BOTH_SELECTED
    && playerAOnCurBoard.value,
  "A-attained": props.status === SpellStatus.A_ATTAINED || props.status === SpellStatus.BOTH_ATTAINED
    && playerAAttainOnCurBoard.value,
  "B-selected": props.status === SpellStatus.B_SELECTED || props.status === SpellStatus.BOTH_SELECTED
    && playerBOnCurBoard.value,
  "B-attained": props.status === SpellStatus.B_ATTAINED || props.status === SpellStatus.BOTH_ATTAINED
    && playerBAttainOnCurBoard.value,
  "A-local-selected": props.selected && isPlayerA.value,
  "B-local-selected": props.selected && isPlayerB.value,
  //see-only为非选手的视觉效果
  "A-see-only": props.status === SpellStatus.LEFT_SEE_ONLY,
  "B-see-only": props.status === SpellStatus.RIGHT_SEE_ONLY,
  //完全隐藏
  "Hidden": props.status === SpellStatus.BOTH_HIDDEN,
  //只显示TH[0-9]+
  "Only-reveal-game": props.status === SpellStatus.ONLY_REVEAL_GAME,
  //只显示完整的游戏信息
  "Only-reveal-game-stage": props.status === SpellStatus.ONLY_REVEAL_GAME_STAGE,
  //只显示星级
  "Only-reveal-star": props.status === SpellStatus.ONLY_REVEAL_STAR,

  "is-portal": (props.isPortalA && props.isACurrentBoard) || (props.isPortalB && props.isBCurrentBoard),
  "A-selected-other-board": (props.status === SpellStatus.A_SELECTED || props.status === SpellStatus.BOTH_SELECTED)
    && !playerAOnCurBoard.value,
  "B-selected-other-board": (props.status === SpellStatus.B_SELECTED || props.status === SpellStatus.BOTH_SELECTED)
    && !playerBOnCurBoard.value,
  "A-attained-other-board": (props.status === SpellStatus.A_ATTAINED || props.status === SpellStatus.BOTH_ATTAINED)
    && !playerAAttainOnCurBoard.value,
  "B-attained-other-board": (props.status === SpellStatus.B_ATTAINED || props.status === SpellStatus.BOTH_ATTAINED)
    && !playerBAttainOnCurBoard.value,
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
      opacity: 0.15;
    }
  }

  &.B-local-selected {
    &::after {
      background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
      opacity: 0.15;
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
    .spell-card-info > * {
      visibility: hidden;
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
      opacity: 0.3;
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
      opacity: 0.3;
    }
  }

  &.Only-reveal-game{
    .spell-card-info > *:not(.desc) {
      visibility: hidden;
    }
  }

  &.Only-reveal-game-stage {
    .spell-card-info > *:not(.desc) {
      visibility: hidden;
    }
  }

  &.Only-reveal-star{
    .spell-card-info > *:not(.level) {
      visibility: hidden;
    }
  }

  &.A-selected-other-board{
    &::before {
      background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
      -webkit-animation: breath 6s infinite linear;
      animation: breath 6s infinite linear;
      opacity: .5;
    }
  }

  &.B-selected-other-board{
    &::after {
      background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
      -webkit-animation: breath 6s infinite linear;
      animation: breath 6s infinite linear;
      opacity: .5;
    }
  }

  &.A-selected-other-board.B-selected-other-board {
    &::before {
      transform: skew(-0.89rad) translateX(0%);
      left: -50%;
    }
    &::after {
      transform: skew(-0.89rad) translateX(0%);
      left: 50%;
    }
  }

  &.A-selected-other-board.B-selected {
    &::before {
      transform: skew(-0.89rad) translateX(0%);
      left: -50%;
    }
    &::after {
      transform: skew(-0.89rad) translateX(0%);
      left: 50%;
    }
  }

  &.A-selected.B-selected-other-board {
    &::before {
      transform: skew(-0.89rad) translateX(0%);
      left: -50%;
    }
    &::after {
      transform: skew(-0.89rad) translateX(0%);
      left: 50%;
    }
  }

  &.A-attained-other-board {
    &::before {
      background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
      opacity: 0.5;
    }
  }

  &.B-attained-other-board {
    &::after {
      background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
      opacity: 0.5;
    }
  }

  &.A-attained-other-board.B-attained-other-board {
    &::before {
      transform: skew(-0.89rad) translateX(0%);
      left: -50%;
    }
    &::after {
      transform: skew(-0.89rad) translateX(0%);
      left: 50%;
    }
  }

  &.is-portal {
    // 此处不改变 spell-card-cell 自身的位置
    // 而是通过其子元素的伪元素来添加图标，以避免样式冲突
    .spell-card-info::before {
      content: '🔄';
      position: absolute;
      top: 0;      // 距离顶部边缘一点距离，视觉效果更好
      left: 0;     // 距离左侧边缘一点距离
      font-size: 16px; // 可根据需要调整图标大小
      z-index: 5;      // 确保图标显示在最上层
      text-shadow: 0 0 1px rgba(0, 0, 0, 0.7);
      opacity: 0.5;
    }
  }
}
</style>
