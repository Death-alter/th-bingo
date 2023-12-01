<template>
  <div class="game-bp">
    <div class="game-list">
      <div
        :class="{
          'game-item': true,
          'current-select-A': isPlayerA && modelValue === game.code,
          'current-select-B': isPlayerB && modelValue === game.code,
        }"
        v-for="(game, index) in gameList"
        :key="index"
        @click="selectGame(game.code)"
      >
        <el-tooltip :content="game.name" placement="top" effect="light">TH{{ game.code }}</el-tooltip>
      </div>
      <div
        v-if="step < 3"
        :class="{
          'game-item': true,
          'current-select-A': isPlayerA && modelValue === 'EX',
          'current-select-B': isPlayerB && modelValue === 'EX',
        }"
        @click="selectGame('EX')"
      >
        <el-tooltip content="EX" placement="top" effect="light">EX</el-tooltip>
      </div>
    </div>
    <div class="tooltip-text">{{ tooltipText }}</div>
    <el-row style="width: 100%; margin-top: 10px">
      <el-col :span="12">
        <div class="title">选择作品</div>
        <div class="selected-game-list A-selected">
          <div class="game-item" v-for="(game, index) in ASelectedList" :key="index">TH{{ game }}</div>
        </div>
        <div class="title">禁用作品</div>
        <div class="selected-game-list banned">
          <div class="game-item" v-for="(game, index) in ABannedList" :key="index">TH{{ game }}</div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="title">选择作品</div>
        <div class="selected-game-list B-selected">
          <div class="game-item" v-for="(game, index) in BSelectedList" :key="index">TH{{ game }}</div>
        </div>
        <div class="title">禁用作品</div>
        <div class="selected-game-list banned">
          <div class="game-item" v-for="(game, index) in BBannedList" :key="index">TH{{ game }}</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from "vue";
import { useStore } from "vuex";
import Config from "@/config";
import { ElTooltip, ElRow, ElCol } from "element-plus";
import { BpStatus } from "@/types";

export default defineComponent({
  name: "Room",
  components: {
    ElRow,
    ElCol,
    ElTooltip,
  },
  props: {
    modelValue: {
      type: String,
      default: 0,
    },
  },
  emits: ["update:modelValue"],
  setup(props, context) {
    const store = useStore();
    const gameList = { ...Config.gameOptionList };
    const step = ref(1);
    const ASelectedList = ref([]);
    const BSelectedList = ref([]);
    const ABannedList = ref([]);
    const BBannedList = ref([]);

    const isPlayerA = computed(() => store.getters.isPlayerA);
    const isPlayerB = computed(() => store.getters.isPlayerB);
    const isHost = computed(() => store.getters.isHost);
    const bpStatus = computed(() => store.getters.bpStatus);
    const tooltipText = computed(() => {
      console.log(bpStatus.value);
      switch (bpStatus.value) {
        case BpStatus.IS_A_PICK:
          if (isHost.value) {
            return "等待左侧玩家选择一个作品";
          }
          if (isPlayerA.value) {
            return "请选择一个作品";
          }
          if (isPlayerB.value) {
            return "等待对手选择一个作品";
          }
        case BpStatus.IS_B_PICK:
          if (isHost.value) {
            return "等待右侧玩家选择一个作品";
          }
          if (isPlayerA.value) {
            return "等待对手选择一个作品";
          }
          if (isPlayerB.value) {
            return "请选择一个作品";
          }
        case BpStatus.IS_A_BAN:
          if (isHost.value) {
            return "等待左侧玩家禁用一个作品";
          }
          if (isPlayerA.value) {
            return "请禁用一个作品";
          }
          if (isPlayerB.value) {
            return "等待对手禁用一个作品";
          }
        case BpStatus.IS_B_BAN:
          if (isHost.value) {
            return "等待右侧玩家禁用一个作品";
          }
          if (isPlayerA.value) {
            return "等待对手禁用一个作品";
          }
          if (isPlayerB.value) {
            return "请禁用一个作品";
          }
        case BpStatus.SELECT_OPEN_EX:
          if (isHost.value) {
            return "等待玩家选择是否开启EX";
          }
          if (isPlayerA.value || isPlayerB.value) {
            return "请选择是否开启EX";
          }
      }
    });

    watch(
      () => store.getters.banPickInfo,
      (newVal, oldVal) => {
        step.value = newVal.phase;
        ASelectedList.value = newVal.a_pick;
        ABannedList.value = newVal.a_ban;
        BSelectedList.value = newVal.b_pick;
        BBannedList.value = newVal.b_ban;
      }
    );

    const selectGame = (code) => {
      if (props.modelValue === code) {
        context.emit("update:modelValue", "");
      } else {
        context.emit("update:modelValue", code);
      }
    };

    const confirmSelect = () => {
      switch (bpStatus.value) {
        case BpStatus.IS_A_BAN:
        case BpStatus.IS_A_PICK:
          if (isPlayerA.value) {
            store.dispatch("ban_pick", { selection: props.modelValue });
          }
        case BpStatus.IS_B_BAN:
        case BpStatus.IS_B_PICK:
          if (isPlayerB.value) {
            store.dispatch("ban_pick", { selection: props.modelValue });
          }
      }
    };

    return {
      gameList,
      ASelectedList,
      BSelectedList,
      ABannedList,
      BBannedList,
      step,
      bpStatus,
      isPlayerA,
      isPlayerB,
      isHost,
      tooltipText,
      selectGame,
    };
  },
});
</script>

<style lang="scss" scoped>
.game-bp {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: auto;
  background-color: white;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;

  .game-list {
    margin-top: 20px;
    width: 480px;
    display: flex;
    flex-wrap: wrap;
  }

  .game-item {
    width: 48px;
    height: 48px;
    border: 4px solid #000;
    margin: 10px 20px;
    line-height: 48px;
    cursor: pointer;
    user-select: none;
    font-size: 18px;

    &.A-selected {
      color: var(--A-color);
      border-color: var(--A-color);
    }

    &.B-selected {
      color: var(--B-color);
      border-color: var(--B-color);
    }

    &.banned {
      color: gray;
      border-color: gray;
    }

    &.current-select-A {
      box-shadow: 0 0 4px 2px var(--A-color);
    }

    &.current-select-B {
      box-shadow: 0 0 4px 2px var(--B-color);
    }
  }

  .title {
    font-weight: 600;
  }

  .selected-game-list {
    display: flex;
    justify-content: center;

    &.A-selected {
      .game-item {
        color: var(--A-color);
        border-color: var(--A-color);
      }
    }

    &.B-selected {
      .game-item {
        color: var(--B-color);
        border-color: var(--B-color);
      }
    }

    &.banned {
      .game-item {
        color: gray;
        border-color: gray;
      }
    }
  }

  .tooltip-text {
    height: 30px;
    line-height: 30px;
  }
}
</style>
