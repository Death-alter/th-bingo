<template>
  <div class="rule-standard">
    <div class="bingo-wrap">
      <div :class="{ 'bingo-items': true, empty: !gameData.spells || !gameData.spells.length }">
        <spell-card-cell
          v-for="(item, index) in gameData.spells"
          :key="index"
          :name="item.name"
          @click="selectSpellCard"
        ></spell-card-cell>
      </div>
      <bingo-effect class="bingo-effect" />
    </div>
    <div class="count-down-wrap">
      <count-down
        ref="countDown"
        :seconds="countDownSeconds || roomSettings.countDownTime"
        @complete="onCountDownComplete"
        v-show="standbyPhase"
      ></count-down>
    </div>
    <div v-if="isHost">
      <el-button type="primary" @click="start">{{ inGame ? "结 束" : "开 始" }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useStore } from "vuex";
import SpellCardCell from "@/components/spell-card-cell.vue";
import BingoEffect from "@/components/bingo-effect/index.vue";
import CountDown from "@/components/count-down.vue";
import { ElButton } from "element-plus";

export default defineComponent({
  name: "Room",
  data() {
    return {
      paused: true,
      countDownSeconds: 0,
      standbyPhase: false,
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
    const countDown = ref();
    return {
      gameData: computed(() => store.getters.gameData),
      roomSettings: computed(() => store.getters.roomSettings),
      inRoom: computed(() => store.getters.inRoom),
      isHost: computed(() => store.getters.isHost),
      inGame: computed(() => store.getters.inGame),
      countDown,
    };
  },
  mounted() {
    this.countDownSeconds = this.roomSettings.countDownTime;
  },
  watch: {
    gameData(value) {
      if (value.countdown && value.countdown !== this.countDownSeconds) {
        this.countDownSeconds = value.countdown;
      }
      if (value.start_time) {
        const seconds = this.countDownSeconds - (value.time - value.start_time) / 1000;
        if (seconds > 0) {
          this.standbyPhase = true;
          this.countDownSeconds = Math.ceil(seconds);
        }
      }
      if (value.spells) {
        this.$nextTick(() => {
          this.countDown.start();
        });
      }
    },
  },
  methods: {
    start() {
      if (this.inGame) {
        this.$store.dispatch("stop_game").then(() => {
          this.$store.commit("change_game_state");
          this.countDown.reset();
        });
      } else {
        this.$store
          .dispatch("start_game", {
            game_time: this.roomSettings.gameTimeLimit,
            countdown: this.roomSettings.countDownTime,
            games: this.roomSettings.checkList,
          })
          .then(() => {
            this.$store.commit("change_game_state");
            this.standbyPhase = true;
            this.countDown.start();
          });
      }
    },
    onCountDownComplete() {
      this.standbyPhase = false;
    },
    selectSpellCard() {},
    confirmSelect() {},
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
  height: 35px;
}
</style>
