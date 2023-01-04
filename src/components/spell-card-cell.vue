<template>
  <div
    :class="{
      'spell-card-cell': true,
      banned: status === -1,
      'A-selected': status === 1 || status === 2,
      'A-attained': status === 5 || status === 4,
      'B-selected': status === 3 || status === 2,
      'B-attained': status === 7 || status === 4,
      'A-local-selected': isPlayerA && selected,
      'B-local-selected': isPlayerB && selected,
    }"
    @click="onClick"
  >
    <div class="spell-card-info">
      <div class="level" v-if="level">
        <div
          class="level-icons"
          :class="{
            level1: level === 1,
            level2: level === 2,
            level3: level === 3,
          }"
        >
          <el-icon v-for="(item, index) in new Array(level)" :key="index"><StarFilled /></el-icon>
        </div>
      </div>
      <div class="desc">
        {{ desc }}
      </div>
      <div class="name">{{ name }}</div>
      <div class="game-name"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import { ElIcon } from "element-plus";

export default defineComponent({
  name: "SpellCardCell",
  data() {
    return {};
  },
  components: {
    ElIcon,
  },
  props: {
    level: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      default: 0,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    desc: {
      type: String,
      default: "",
    },
  },
  setup() {
    const store = useStore();
    return {
      roomSettings: computed(() => store.getters.roomSettings),
      isPlayerA: computed(() => store.getters.isPlayerA),
      isPlayerB: computed(() => store.getters.isPlayerB),
    };
  },
  emits: ["click"],
  methods: {
    onClick() {
      if (!this.disabled) {
        this.$emit("click");
      }
    },
  },
});
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

      .level1 {
        color: rgb(233, 220, 36);
      }

      .level2 {
        color: rgb(212, 124, 9);
      }

      .level3 {
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
      font-size: 14px;
    }
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
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
}
</style>
