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
      <template v-if="roomData.type === 1">
        <standard v-if="roomData.host" />
        <standard-solo v-else />
      </template>
      <bp v-if="roomData.type === 2" />
      <template v-if="roomData.type === 3">
        <bingo-link v-if="roomData.host" />
        <bingo-link-solo v-else />
      </template>
    </div>
    <div class="audio">
      <bgm ref="spellCardGrabbedAudio" :src="require('@/assets/audio/spell_card_grabbed.mp3')"></bgm>
      <bgm ref="gamePointAudio" :src="require('@/assets/audio/game_point.wav')"></bgm>
      <bgm
        ref="turn1CountdownAudio"
        src="http://link.hhtjim.com/163/22636828.mp3"
        :loop="true"
        :endTime="174"
        :volume="volume"
        :muted="muted"
      ></bgm>
      <bgm
        ref="turn2CountdownAudio"
        src="http://link.hhtjim.com/163/30854145.mp3"
        :loop="true"
        :endTime="242"
        :volume="volume"
        :muted="muted"
      ></bgm>
      <bgm
        ref="turn3CountdownAudio"
        src="http://link.hhtjim.com/163/22636827.mp3"
        :loop="true"
        :endTime="184"
        :volume="volume"
        :muted="muted"
      ></bgm>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, getCurrentInstance, onMounted, onUnmounted, watch } from "vue";
import { useStore } from "vuex";
import standard from "./games/standard.vue";
import standardSolo from "./games/standardSolo.vue";
import bp from "./games/bp.vue";
import bingoLink from "./games/link.vue";
import bingoLinkSolo from "./games/linkSolo.vue";
import bgm from "@/components/bgm.vue";

export default defineComponent({
  name: "Room",
  data() {
    return {
      needWin: 1,
      volume: 0.3,
    };
  },
  components: {
    standard,
    standardSolo,
    bp,
    bingoLink,
    bingoLinkSolo,
    bgm,
  },
  setup() {
    const store = useStore();
    const { proxy }: any = getCurrentInstance();
    const spellCardGrabbedAudio = ref();
    const gamePointAudio = ref();
    const turn1CountdownAudio = ref();
    const turn2CountdownAudio = ref();
    const turn3CountdownAudio = ref();
    let ws: WebSocket | null = null;
    let timer: number = 0;

    function connectToolServer() {
      ws = new WebSocket(process.env.VUE_APP_TOOL_WS_API);
      ws.onopen = () => {
        console.log("tool_ws已连接");
      };
      ws.onerror = () => {
        console.log("tool_ws连接失败");
        ws = null;
        timer = window.setTimeout(connectToolServer, 5000);
      };
      ws.onmessage = ({ data }) => {
        if (!proxy.roomData.started || proxy.gamePhase === 1) return;
        data = JSON.parse(data);

        //选择符卡时检查有没有已选的符卡
        if (data.event === 0) {
          for (let item of proxy.gameData.status) {
            if ((item === 1 && proxy.isPlayerA) || (item === 3 && proxy.isPlayerB)) {
              return;
            }
          }
        }

        for (let i = 0; i < proxy.gameData.spells.length; i++) {
          const item = proxy.gameData.spells[i];
          if (item.game == data.game && item.id == data.id) {
            if (data.event === 0 && proxy.gameData.status[i] === 0) {
              if (proxy.isPlayerA) {
                proxy.$store.dispatch("update_spell", { idx: i, status: 1 });
              } else if (proxy.isPlayerB && proxy.gameData.status[i] !== 3) {
                proxy.$store.dispatch("update_spell", { idx: i, status: 3 });
              }
            } else if (data.event === 1) {
              if (proxy.isPlayerA && proxy.gameData.status[i] === 1) {
                proxy.$store.dispatch("update_spell", { idx: i, status: 5 });
              } else if (proxy.isPlayerB && proxy.gameData.status[i] === 3) {
                proxy.$store.dispatch("update_spell", { idx: i, status: 7 });
              }
            }
            break;
          }
        }
      };
    }

    onMounted(() => {
      proxy.$bus.on("spell_card_grabbed", () => {
        spellCardGrabbedAudio.value.play();
      });
      proxy.$bus.on("game_phase", () => {
        spellCardGrabbedAudio.value.play();
      });
      proxy.$bus.on("right_link_start", () => {
        spellCardGrabbedAudio.value.play();
      });
      proxy.$bus.on("game_point", () => {
        gamePointAudio.value.play();
      });
    });
    onUnmounted(() => {
      proxy.$bus.off("spell_card_grabbed");
      proxy.$bus.off("right_link_start");
      proxy.$bus.off("game_point");
      ws?.close();
    });

    const gameData = computed(() => store.getters.gameData);
    const roomData = computed(() => store.getters.roomData);

    watch(gameData, (value) => {
      if (proxy.isPlayer && ws === null && value.enable_tools) {
        connectToolServer();
      }
    });

    watch(roomData, (value, oldValue) => {
      if (oldValue.started && !value.started) {
        if (!ws) {
          window.clearTimeout(timer);
          timer = 0;
        } else {
          ws.close();
        }
      }
    });

    if (store.getters.roomData.started) {
      store.dispatch("get_spells");
    }

    return {
      roomData,
      gameData,
      isPlayer: computed(() => store.getters.isPlayer),
      isPlayerA: computed(() => store.getters.isPlayerA),
      isPlayerB: computed(() => store.getters.isPlayerB),
      gamePhase: computed(() => store.getters.gameData.phase || 0),
      timeMistake: computed(() => store.getters.heartBeat.timeMistake),
      needWinArr: computed(() => new Array(proxy.needWin)),
      BGMpaused: computed(
        () => proxy.turn1CountdownAudio.paused && proxy.turn2CountdownAudio.paused && proxy.turn3CountdownAudio.paused
      ),
      muted: computed(() => store.getters.roomSettings.bgmMuted),
      spellCardGrabbedAudio,
      gamePointAudio,
      turn1CountdownAudio,
      turn2CountdownAudio,
      turn3CountdownAudio,
      ws,
      timer,
    };
  },
  watch: {
    gameData(value) {
      if (value.need_win) {
        this.needWin = value.need_win;
      }
      if (value.phase === 1 && this.BGMpaused) {
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
        const score = this.roomData.score[0] + this.roomData.score[1];
        switch (score) {
          case 0:
            this.turn1CountdownAudio.setCurrent(pasedTime);
            this.turn1CountdownAudio.play();
            break;
          case 1:
            this.turn2CountdownAudio.setCurrent(pasedTime);
            this.turn2CountdownAudio.play();
            break;
          case 2:
            this.turn3CountdownAudio.setCurrent(pasedTime);
            this.turn3CountdownAudio.play();
            break;
          default:
            this.turn1CountdownAudio.setCurrent(pasedTime);
            this.turn1CountdownAudio.play();
        }
      } else {
        this.stopBGM();
      }
    },
  },
  methods: {
    stopBGM() {
      this.turn1CountdownAudio.stop();
      this.turn2CountdownAudio.stop();
      this.turn3CountdownAudio.stop();
    },
  },
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
