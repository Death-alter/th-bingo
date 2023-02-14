<template>
  <div class="room">
    <div class="room-title" v-if="roomData.names">
      <div class="player-A">{{ roomData.names[0] }}</div>
      <div class="scoreboard">
        <div class="A-scoreboard" v-if="roomData.names[0]">
          <div
            :class="{ 'score-circle': true, 'scored-A': roomData.score[0] >= needWin - index }"
            v-for="(item, index) in needWinArr"
            :key="index"
          ></div>
        </div>
        <div class="vs-text">VS</div>
        <div class="B-scoreboard" v-if="roomData.names[1]">
          <div
            :class="{ 'score-circle': true, 'scored-B': roomData.score[1] >= index + 1 }"
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
    <div class="audio">
      <bgm ref="spellCardGrabbedAudio" :src="require('@/assets/audio/spell_card_grabbed.mp3')"></bgm>
      <bgm ref="turn1CountdownAudio" src="http://link.hhtjim.com/163/22636827.mp3" :loop="true" :endTime="184"></bgm>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, getCurrentInstance, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import standard from "./games/standard.vue";
import bp from "./games/bp.vue";
import bingoLink from "./games/link.vue";
import bgm from "@/components/bgm.vue";

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
    bgm,
  },
  setup() {
    const store = useStore();
    const { proxy }: any = getCurrentInstance();
    const spellCardGrabbedAudio = ref();
    const turn1CountdownAudio = ref();

    onMounted(() => {
      proxy.$bus.on("spell_card_grabbed", () => {
        spellCardGrabbedAudio.value.play();
      });
    });
    onUnmounted(() => {
      proxy.$bus.off("spell_card_grabbed");
    });

    if (store.getters.roomData.started) {
      store.dispatch("get_spells");
    }
    return {
      roomData: computed(() => store.getters.roomData),
      gameData: computed(() => store.getters.gameData),
      gamePhase: computed(() => store.getters.gameData.phase || 0),
      timeMistake: computed(() => store.getters.heartBeat.timeMistake),
      spellCardGrabbedAudio,
      turn1CountdownAudio,
    };
  },
  watch: {
    gameData(value) {
      if (value.need_win) {
        this.needWin = value.need_win;
      }
      if (value.phase === 1 && this.turn1CountdownAudio.paused) {
        const pauseBeginTime = value.pause_begin_ms || null;
        const currentTime = new Date().getTime() + this.timeMistake;
        const startTime = value.start_time;
        const totalPauseTime = value.total_pause_ms || 0;
        let pasedTime;
        if (pauseBeginTime) {
          pasedTime = (pauseBeginTime - startTime - totalPauseTime) / 1000;
        } else {
          pasedTime = (currentTime - startTime - totalPauseTime) / 1000;
        }
        this.turn1CountdownAudio.setCurrent(pasedTime);
        this.turn1CountdownAudio.play();
      } else {
        this.turn1CountdownAudio.stop();
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

    &.scored-A {
      background-color: var(--A-color);
    }

    &.scored-B {
      background-color: var(--B-color);
    }
  }
}
</style>
