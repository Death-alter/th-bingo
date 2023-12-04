<template>
  <div class="room">
    <div class="room-title" v-if="roomData.names">
      <div class="player-A">{{ roomData.names[0] }}</div>
      <div class="scoreboard">
        <div class="A-scoreboard">
          <template v-if="roomData.names[0]">
            <div
              :class="{ 'score-circle': true, 'scored-A': roomData.score[0] >= needWin - index }"
              v-for="(item, index) in needWinArr"
              :key="index"
            ></div>
          </template>
        </div>
        <div class="vs-text">VS</div>
        <div class="B-scoreboard">
          <template v-if="roomData.names[1]">
            <div
              :class="{ 'score-circle': true, 'scored-B': roomData.score[1] >= index + 1 }"
              v-for="(item, index) in needWinArr"
              :key="index"
            ></div
          ></template>
        </div>
      </div>
      <div class="player-B">{{ roomData.names[1] }}</div>
    </div>
    <div class="room-content">
      <el-row class="">
        <el-col :span="4">
          <div class="player-extra-info">
            <slot name="left"></slot>
          </div>
        </el-col>
        <el-col :span="16">
          <div class="bingo-wrap">
            <right-click-menu
              style="width: 100%; height: 100%"
              :menuData="menu"
              :disabled="!menu || menu.length === 0"
              @click="onMenuClick"
            >
              <div class="bingo-items">
                <template v-if="gameData.spells">
                  <div class="spell-card" v-for="(item, index) in gameData.spells" :key="index">
                    <slot name="cell" :item="item" :index="index">
                      <spell-card-cell
                        :name="item.name"
                        :desc="item.desc"
                        :level="isBingoStandard ? null : item.star"
                        @click="selectSpellCard(index)"
                        :selected="selectedSpellIndex === index"
                        :status="gameData.status[index]"
                        :index="index"
                      ></spell-card-cell>
                    </slot>
                  </div>
                </template>
              </div>
            </right-click-menu>
            <game-alert ref="gameAlertRef" />
            <slot name="extra"></slot>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="player-extra-info">
            <slot name="right"></slot>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="room-actions">
      <div class="widget-wrap">
        <slot name="widget"></slot>
      </div>
      <div class="bingo-buttons">
        <div class="sub-button">
          <slot name="button-left-2"></slot>
        </div>
        <div class="sub-button">
          <slot name="button-left-1"></slot>
        </div>
        <div class="main-button">
          <slot name="button-center"></slot>
        </div>
        <div class="sub-button">
          <slot name="button-right-1"></slot>
        </div>
        <div class="sub-button">
          <slot name="button-right-2"></slot>
        </div>
      </div>
    </div>
    <div class="audio">
      <bgm ref="spellCardGrabbedAudioRef" :src="require('@/assets/audio/spell_card_grabbed.mp3')"></bgm>
      <bgm ref="gamePointAudioRef" :src="require('@/assets/audio/game_point.wav')"></bgm>
      <bgm
        ref="turn1CountdownAudioRef"
        src="http://link.hhtjim.com/163/22636828.mp3"
        :loop="true"
        :endTime="174"
        :volume="volume"
        :muted="muted"
      ></bgm>
      <bgm
        ref="turn2CountdownAudioRef"
        src="http://link.hhtjim.com/163/30854145.mp3"
        :loop="true"
        :endTime="242"
        :volume="volume"
        :muted="muted"
      ></bgm>
      <bgm
        ref="turn3CountdownAudioRef"
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
import { defineComponent, computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useStore } from "vuex";
import SpellCardCell from "@/components/spell-card-cell.vue";
import RightClickMenu from "@/components/right-click-menu.vue";
import GameAlert from "./gameAlert.vue";
import { ElRow, ElCol } from "element-plus";
import { Role, BingoType } from "@/types/index";
import bgm from "@/components/bgm.vue";
import Mit from "@/mitt";
import GameTime from "@/utils/GameTime";

export default defineComponent({
  name: "GameLayout",
  components: {
    SpellCardCell,
    RightClickMenu,
    ElRow,
    ElCol,
    GameAlert,
    bgm,
  },
  props: {
    menu: {
      type: Array as () => { label: string; value: number; tag?: string }[],
    },
    selectedSpellIndex: {
      type: Number,
      required: true,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:selectedSpellIndex"],
  setup(props, context) {
    const store = useStore();

    const volume = ref(0.3);

    const gameAlertRef = ref();
    const spellCardGrabbedAudioRef = ref();
    const gamePointAudioRef = ref();
    const turn1CountdownAudioRef = ref();
    const turn2CountdownAudioRef = ref();
    const turn3CountdownAudioRef = ref();

    const gameData = computed(() => store.getters.gameData);
    const roomData = computed(() => store.getters.roomData);
    const isWatcher = computed(() => store.getters.userRole.value === Role.WATHCER);
    const isPlayerA = computed(() => store.getters.isPlayerA);
    const isPlayerB = computed(() => store.getters.isPlayerB);
    const isBingoStandard = computed(() => store.getters.roomData.type === BingoType.STANDARD);
    const isBingoBp = computed(() => store.getters.roomData.type === BingoType.BP);
    const isBingoLink = computed(() => store.getters.roomData.type === BingoType.LINK);
    const needWin = computed(() => roomData.value.room_config.need_win);
    const spellCardSelected = computed(() => {
      if (store.getters.isPlayerA) {
        return store.getters.playerASelectedIndex !== -1;
      }
      if (store.getters.isPlayerB) {
        return store.getters.playerBSelectedIndex !== -1;
      }
      return false;
    });
    const BGMpaused = computed(
      () =>
        turn1CountdownAudioRef.value.paused &&
        turn2CountdownAudioRef.value.paused &&
        turn3CountdownAudioRef.value.paused
    );

    const selectSpellCard = (index: number) => {
      if (isWatcher.value) {
        return;
      }

      if (props.selectedSpellIndex === index) {
        setSelectedSpellIndex(-1);
      } else {
        if (props.multiple) {
          if (gameData.value.status[index] === 0) setSelectedSpellIndex(index);
        } else {
          if (
            !spellCardSelected.value &&
            (gameData.value.status[index] === 0 ||
              (isPlayerB.value && gameData.value.status[index] === 1) ||
              (isPlayerA.value && gameData.value.status[index] === 3))
          ) {
            setSelectedSpellIndex(index);
          }
        }
      }
    };
    const onMenuClick = ({ event, target, item }: any) => {
      const index = target.getAttribute("index");
      if (index !== null) {
        store.dispatch("update_spell", { idx: parseInt(index), status: item.value });
      }
    };
    const stopBGM = () => {
      turn1CountdownAudioRef.value.stop();
      turn2CountdownAudioRef.value.stop();
      turn3CountdownAudioRef.value.stop();
    };
    const showAlert = (text?: string, color?: string) => {
      gameAlertRef.value.show(text, color);
    };
    const hideAlert = () => {
      gameAlertRef.value.hide();
    };
    const setSelectedSpellIndex = (value) => {
      context.emit("update:selectedSpellIndex", value);
    };

    onMounted(() => {
      Mit.on("spell_card_grabbed", () => {
        spellCardGrabbedAudioRef.value?.play();
      });
      Mit.on("game_pause", () => {
        spellCardGrabbedAudioRef.value?.play();
      });
      Mit.on("right_link_start", () => {
        spellCardGrabbedAudioRef.value?.play();
      });
      Mit.on("game_point", () => {
        gamePointAudioRef.value?.play();
      });
      Mit.on("alter", () => {
        spellCardGrabbedAudioRef.value?.stop();
        spellCardGrabbedAudioRef.value?.play();
      });
    });
    onUnmounted(() => {
      Mit.off("spell_card_grabbed");
      Mit.off("game_pause");
      Mit.off("right_link_start");
      Mit.off("game_point");
      Mit.off("alter");
    });

    watch(gameData, (value) => {
      if (value.phase === 1 && BGMpaused.value) {
        const score = roomData.value.score[0] + roomData.value.score[1];
        switch (score) {
          case 0:
            turn1CountdownAudioRef.value.setCurrent(GameTime.passed);
            turn1CountdownAudioRef.value.play();
            break;
          case 1:
            turn2CountdownAudioRef.value.setCurrent(GameTime.passed);
            turn2CountdownAudioRef.value.play();
            break;
          case 2:
            turn3CountdownAudioRef.value.setCurrent(GameTime.passed);
            turn3CountdownAudioRef.value.play();
            break;
          default:
            turn1CountdownAudioRef.value.setCurrent(GameTime.passed);
            turn1CountdownAudioRef.value.play();
        }
      } else {
        stopBGM();
      }
    });

    if (store.getters.roomData.started) {
      store.dispatch("get_spells");
    }

    return {
      volume,
      gameData,
      roomData,
      isPlayerA,
      isPlayerB,
      isWatcher,
      isBingoStandard,
      isBingoBp,
      isBingoLink,
      needWin,
      needWinArr: computed(() => new Array(needWin.value)),
      muted: computed(() => store.getters.roomSettings.bgmMuted),
      gameAlertRef,
      spellCardGrabbedAudioRef,
      turn1CountdownAudioRef,
      turn2CountdownAudioRef,
      turn3CountdownAudioRef,
      onMenuClick,
      selectSpellCard,
      setSelectedSpellIndex,
      showAlert,
      hideAlert,
    };
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
    height: 32px;
  }

  .player-B {
    text-align: left;
    width: 35%;
    height: 32px;
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
      height: 32px;
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
    justify-content: space-between;
    align-content: space-between;
    border: 1px solid #000;
    border-radius: 4px;
    padding: 2px;
    box-sizing: border-box;

    .spell-card {
      border: 1px solid #000;
      border-radius: 4px;
      width: 19.4%;
      height: 19.4%;
    }
  }
}

.bingo-effect {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 99;
  width: 100%;
  height: 100%;
}

.widget-wrap {
  margin: 10px 0;
  height: 35px;
}

.audio {
  display: none;
}

.host-buttons > * {
  margin: 0 15px;
}

.player-extra-info {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.bingo-buttons {
  display: flex;
  justify-content: center;
  align-items: center;

  & > .main-button {
    margin: 0 10px;
    height: 32px;
  }

  & > .sub-button {
    width: 80px;
    margin: 0 10px;
    height: 24px;
  }
}

:deep() {
  .player-extra-info > * {
    margin: 10px 0;
  }
}
</style>
