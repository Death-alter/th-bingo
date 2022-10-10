<template>
  <div class="rule-standard">
    <div class="bingo-wrap">
      <div :class="{ 'bingo-items': true, empty: !gameData.spells || !gameData.spells.length }">
        <spell-card-cell v-for="(item, index) in gameData.spells" :key="index" :name="item.name"></spell-card-cell>
      </div>
      <bingo-effect class="bingo-effect" />
    </div>
    <div class="count-down-wrap">
      <count-down :seconds="roomSettings.countDownTime" v-model:paused="paused"></count-down>
    </div>
    <div v-if="isHost">
      <el-button type="primary" @click="start">{{ inGame ? "结 束" : "开 始" }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import SpellCardCell from "@/components/spell-card-cell.vue";
import BingoEffect from "@/components/bingo-effect/index.vue";
import CountDown from "@/components/count-down.vue";
import { ElButton } from "element-plus";

export default defineComponent({
  name: "Room",
  data() {
    return {
      spellCardList: [],
      paused: true,
      seconds: 300,
    };
  },

  components: {
    SpellCardCell,
    BingoEffect,
    CountDown,
    ElButton,
  },
  setup() {
    const store = useStore();
    return {
      gameData: computed(() => store.getters.gameData),
      roomSettings: computed(() => store.getters.roomSettings),
      inRoom: computed(() => store.getters.inRoom),
      isHost: computed(() => store.getters.isHost),
      inGame: computed(() => store.getters.inGame),
    };
  },
  methods: {
    start() {
      if (this.inGame) {
        this.$store.dispatch("stop_game");
      } else {
        this.$store
          .dispatch("start_game", {
            time: this.roomSettings.gameTimeLimit,
            games: this.roomSettings.checkList,
          })
          .then(() => {
            this.paused = false;
          });
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.rule-standard {
  width: 100%;
  height: 100%;
}

.bingo-wrap {
  width: 100%;
  height: 500px;
  box-sizing: border-box;

  position: relative;

  .bingo-items {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    border-bottom: 1px solid #000;
    border-right: 1px solid #000;

    &.empty {
      border-top: 1px solid #000;
      border-left: 1px solid #000;
    }

    & > * {
      border-left: 1px solid #000;
      border-top: 1px solid #000;
    }

    // &:nth-child(5n) {
    //   border-left: 1px solid #000;
    // }

    // &:nth-child(n<5) {
    //   border-top: 1px solid #000;
    // }
  }
}

.bingo-effect {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 99;
}

.count-down-wrap {
  font-size: 30px;
  margin: 10px 0;
}
</style>
