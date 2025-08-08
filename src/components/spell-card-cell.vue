<template>
  <div class="spell-card-cell" @click="onClick">
    <div :class="{ 'spell-card-info': true, obverse: true, t: isReversed, ...cellClass }">
      <div class="level" v-if="showLevel">
        <div class="level-icons" :class="levelClass">
          <el-icon v-for="(item, index) in new Array(spellData.star)" :key="index"><StarFilled /></el-icon>
        </div>
      </div>
      <div class="transition" v-if="spellData.is_transition">
        <el-icon :size="14">
          <Switch />
        </el-icon>
      </div>
      <div class="desc">
        {{ spellData.desc }}
      </div>
      <div class="name">{{ spellData.name }}</div>
      <div
        class="fail-count-a"
        v-if="failCountA && status[1] !== SpellStatus.ATTAINED && status[3] !== SpellStatus.ATTAINED"
      >
        失败：{{ failCountA }}
      </div>
      <div
        class="fail-count-b"
        v-if="failCountB && status[1] !== SpellStatus.ATTAINED && status[3] !== SpellStatus.ATTAINED"
      >
        失败：{{ failCountB }}
      </div>
    </div>
    <div :class="{ 'spell-card-info': true, reverse: true, t: isReversed, ...cellClass }" v-if="reverseSpellData">
      <div class="level" v-if="showLevel">
        <div class="level-icons" :class="levelClass">
          <el-icon v-for="(item, index) in new Array(reverseSpellData!.star)" :key="index"><StarFilled /></el-icon>
        </div>
      </div>
      <div class="transition" v-if="reverseSpellData!.is_transition">
        <el-icon :size="14">
          <Switch />
        </el-icon>
      </div>
      <div class="desc">
        {{ reverseSpellData!.desc }}
      </div>
      <div class="name">{{ reverseSpellData!.name }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { ElIcon } from "element-plus";
import { SpellStatus, Spell } from "@/types";
import { useRoomStore } from "@/store/RoomStore";
import { useGameStore } from "@/store/GameStore";

const roomStore = useRoomStore();
const gameStore = useGameStore();

const props = withDefaults(
  defineProps<{
    spellData: Spell;
    reverseSpellData?: Spell;
    disabled?: boolean;
    status?: string;
    selected?: boolean;
    failCountA?: number;
    failCountB?: number;
    showLevel?: boolean;
  }>(),
  {
    disabled: false,
    status: "0000",
    selected: false,
    failCountA: 0,
    failCountB: 0,
    showLevel: false,
  }
);

const emits = defineEmits(["click"]);

const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const pageCode = computed(() => gameStore.page.toString());
const isReversed = computed(() => gameStore.page === 1);
const cellClass = computed(() => ({
  banned: props.status[1] === SpellStatus.BANNED && props.status[3] === SpellStatus.BANNED,
  "A-selected": pageCode.value === props.status[0] && props.status[1] === SpellStatus.SELECTED,
  "A-attained": pageCode.value === props.status[0] && props.status[1] === SpellStatus.ATTAINED,
  "B-selected": pageCode.value === props.status[2] && props.status[3] === SpellStatus.SELECTED,
  "B-attained": pageCode.value === props.status[2] && props.status[3] === SpellStatus.ATTAINED,
  "A-selected-reverse": pageCode.value !== props.status[0] && props.status[1] === SpellStatus.SELECTED,
  "A-attained-reverse": pageCode.value !== props.status[0] && props.status[1] === SpellStatus.ATTAINED,
  "B-selected-reverse": pageCode.value !== props.status[2] && props.status[3] === SpellStatus.SELECTED,
  "B-attained-reverse": pageCode.value !== props.status[2] && props.status[3] === SpellStatus.ATTAINED,
  "A-local-selected": props.selected && isPlayerA.value,
  "B-local-selected": props.selected && isPlayerB.value,
}));
const levelClass = computed(() => `level${props.spellData.star}`);

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
  cursor: pointer;
  user-select: none;
  z-index: 1;
  overflow: hidden;
  perspective: 500px;
  transform-style: preserve-3d;

  .spell-card-info {
    width: 100%;
    height: 100%;
    padding: 4px;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    backface-visibility: hidden;
    transition: transform 0.3s;
    box-sizing: border-box;

    &.obverse.t {
      transform: rotateY(180deg);
    }

    &.reverse {
      transform: rotateY(-180deg);

      &.t {
        transform: rotateY(0deg);
      }
    }

    .transition {
      position: absolute;
      top: 2px;
      left: 2px;
      z-index: -1;
      background-color: var(--el-color-primary);
      color: white;
      width: 20px;
      height: 14px;
      border-radius: 4px;

      & > * {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }

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
      bottom: 2px;
      right: 2px;
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

    &.A-selected-reverse {
      &::before {
        background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
        -webkit-animation: breath 6s infinite linear;
        animation: breath 6s infinite linear;
        filter: saturate(0.3);
      }
    }

    &.B-selected {
      &::after {
        background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
        -webkit-animation: breath 3s infinite linear;
        animation: breath 3s infinite linear;
      }
    }

    &.B-selected-reverse {
      &::after {
        background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
        -webkit-animation: breath 6s infinite linear;
        animation: breath 6s infinite linear;
        filter: saturate(0.3);
      }
    }

    &.A-selected.B-selected,
    &.A-selected-reverse.B-selected,
    &.A-selected.B-selected-reverse,
    &.A-selected-reverse.B-selected-reverse {
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

    &.A-attained-reverse {
      &::before {
        background-image: linear-gradient(var(--A-color) 60%, var(--A-color-dark));
        filter: saturate(0.3);
      }
    }

    &.B-attained {
      &::after {
        background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
      }
    }

    &.B-attained-reverse {
      &::before {
        background-image: linear-gradient(var(--B-color) 60%, var(--B-color-dark));
        filter: saturate(0.3);
      }
    }

    &.A-attained.B-attained,
    &.A-attained.B-attained-reverse,
    &.A-attained-reverse.B-attained,
    &.A-attained-reverse.B-attained-reverse {
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
  }
}
</style>
