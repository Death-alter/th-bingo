<template>
  <div class="room">
    <div class="room-title" v-if="roomData.names">
      <div class="player-A">{{ roomData.names[0] }}</div>
      <div class="scoreboard">
        <div class="A-scoreboard" v-if="roomData.names[0]">
          <div
            :class="{ 'score-circle': true, scored: roomData.score[0] >= needWin - index }"
            v-for="(item, index) in needWinArr"
            :key="index"
          ></div>
        </div>
        <div class="vs-text">VS</div>
        <div class="B-scoreboard" v-if="roomData.names[1]">
          <div
            :class="{ 'score-circle': true, scored: roomData.score[1] >= index + 1 }"
            v-for="(item, index) in needWinArr"
            :key="index"
          ></div>
        </div>
      </div>
      <div class="player-B">{{ roomData.names[1] }}</div>
    </div>
    <div class="game">
      <standard v-if="roomData.type === 1" />
      <bp v-if="roomData.type === 2" />
      <bingo-link v-if="roomData.type === 3" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import standard from "./games/standard.vue";
import bp from "./games/bp.vue";
import bingoLink from "./games/link.vue";

export default defineComponent({
  name: "Room",
  data() {
    return {
      needWin: 1,
    };
  },
  components: {
    standard,
    bp,
    bingoLink,
  },
  setup() {
    const store = useStore();
    if (store.getters.roomData.started) {
      store.dispatch("get_spells");
    }
    return {
      roomData: computed(() => store.getters.roomData),
      gameData: computed(() => store.getters.gameData),
    };
  },
  watch: {
    gameData(value) {
      if (value.need_win) {
        this.needWin = value.need_win;
      }
    },
  },
  computed: {
    needWinArr() {
      return new Array(this.needWin);
    },
  },
  methods: {},
});
</script>

<style lang="scss" scoped>
.room-title {
  font-size: 28px;
  margin: 16px 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .player-A {
    text-align: right;
    width: 35%;
  }

  .player-B {
    text-align: left;
    width: 35%;
  }

  .scoreboard {
    width: 30%;
    display: flex;
    justify-content: center;
    align-items: center;

    .vs-text {
      min-width: 80px;
      text-align: center;
    }

    .A-scoreboard,
    .B-scoreboard {
      width: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .score-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #999;
    margin: 0 3px;

    &.scored {
      background-color: red;
    }
  }
}
</style>
