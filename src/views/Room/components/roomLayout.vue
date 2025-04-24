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
              :disabled="!menu || menu.length === 0 || !inGame"
              @click="onMenuClick"
            >
              <div class="bingo-items">
                <template v-if="gameStore.spells">
                  <div class="spell-card" v-for="(item, index) in gameStore.spells" :key="index">
                    <spell-card-cell
                      :name="item.name"
                      :desc="item.desc"
                      :level="isBingoStandard ? undefined : item.star"
                      :failCountA="gameStore.bpGameData.spell_failed_count_a[index]"
                      :failCountB="gameStore.bpGameData.spell_failed_count_b[index]"
                      @click="selectSpellCard(index)"
                      :selected="selectedSpellIndex === index"
                      :status="gameStore.spellStatus[index]"
                      :index="index"
                    ></spell-card-cell>
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
      <bgm ref="lineWarnAudioRef" :src="require('@/assets/audio/se_ufoalert.mp3')"></bgm>
      <bgm ref="pauseAudioRef" :src="require('@/assets/audio/se_pause.mp3')"></bgm>
      <bgm ref="startGameAudioRef" :src="require('@/assets/audio/start_game.mp3')"></bgm>
      <bgm ref="captureCardAudioRef" :src="require('@/assets/audio/se_cardget.mp3')"></bgm>
      <bgm ref="captureCardFailureAudioRef" :src="require('@/assets/audio/se_pldead00.mp3')"></bgm>
      <bgm ref="winGameAudioRef" :src="require('@/assets/audio/se_extend.mp3')"></bgm>
      <bgm ref="loseGameAudioRef" :src="require('@/assets/audio/se_fault.mp3')"></bgm>
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

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import SpellCardCell from "@/components/spell-card-cell.vue";
import RightClickMenu from "@/components/right-click-menu.vue";
import GameAlert from "./gameAlert.vue";
import { ElRow, ElCol } from "element-plus";
import bgm from "@/components/bgm.vue";
import { useRoomStore } from "@/store/RoomStore";
import { useGameStore } from "@/store/GameStore";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketPushActionType } from "@/utils/webSocket/types";
import { BingoType, GameStatus } from "@/types";

const roomStore = useRoomStore();
const gameStore = useGameStore();

const props = withDefaults(
  defineProps<{
    menu: { label: string; value: number; tag?: string }[];
    multiple?: boolean;
  }>(),
  { multiple: false }
);
const selectedSpellIndex = defineModel();

const volume = ref(0.3);
const needWinArr = computed(() => new Array(needWin.value));
const gameAlertRef = ref();
const spellCardGrabbedAudioRef = ref<InstanceType<typeof bgm>>();
const gamePointAudioRef = ref<InstanceType<typeof bgm>>();
const turn1CountdownAudioRef = ref<InstanceType<typeof bgm>>();
const turn2CountdownAudioRef = ref<InstanceType<typeof bgm>>();
const turn3CountdownAudioRef = ref<InstanceType<typeof bgm>>();
const lineWarnAudioRef = ref<InstanceType<typeof bgm>>();
const pauseAudioRef = ref<InstanceType<typeof bgm>>();
const startGameAudioRef = ref<InstanceType<typeof bgm>>();
const captureCardAudioRef = ref<InstanceType<typeof bgm>>();
const captureCardFailureAudioRef = ref<InstanceType<typeof bgm>>();
const winGameAudioRef = ref<InstanceType<typeof bgm>>();
const loseGameAudioRef = ref<InstanceType<typeof bgm>>();

const muted = computed(() => roomStore.roomSettings.bgmMuted);
const roomData = computed(() => roomStore.roomData);
const isWatcher = computed(() => roomStore.isWatcher);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const inGame = computed(() => roomStore.inGame);
const needWin = computed(() => roomStore.roomConfig.need_win);
const isBingoStandard = computed(() => roomData.value.type === BingoType.STANDARD);
const BGMpaused = computed(
  () =>
    turn1CountdownAudioRef.value?.paused && turn2CountdownAudioRef.value?.paused && turn3CountdownAudioRef.value?.paused
);

const selectSpellCard = (index: number) => {
  if (isWatcher.value) {
    return;
  }
  if (selectedSpellIndex.value === index) {
    selectedSpellIndex.value = -1;
  } else {
    if (props.multiple) {
      if (gameStore.spellStatus[index] === 0 || canSelectBlindCard(gameStore.spellStatus[index])) selectedSpellIndex.value = index;
    } else {
      if (
        gameStore.spellStatus[index] === 0 ||
        (isPlayerB.value && gameStore.spellStatus[index] === 1) ||
        (isPlayerA.value && gameStore.spellStatus[index] === 3) ||
        canSelectBlindCard(gameStore.spellStatus[index])
      ) {
        selectedSpellIndex.value = index;
      }
    }
  }
};

function canSelectBlindCard (status: number) {
  return status === 0x1000 || status === 0x1010 || status === 0x1011 || status === 0x1012
}

const onMenuClick = ({ event, target, item }: any) => {
  const index = target.getAttribute("index");
  if (index !== null) {
    if (item.isReset != null && item.isReset == false) {
      gameStore.finishSpell(parseInt(index), false, gameStore.spellStatus[index] === 5 ? 0 : 1);
    } else {
      gameStore.updateSpellStatus(parseInt(index), item.value);
    }
  }
};
const stopBGM = () => {
  turn1CountdownAudioRef.value?.stop();
  turn1CountdownAudioRef.value?.stop();
  turn1CountdownAudioRef.value?.stop();
};
watch(
  () => roomStore.roomData.started,
  () => {
    stopBGM();
  }
);
const showAlert = (text?: string, color?: string) => {
  gameAlertRef.value.show(text, color);
};
const hideAlert = () => {
  gameAlertRef.value.hide();
};

const warnGamePoint = () => {
  //gamePointAudioRef.value?.play();
  lineWarnAudioRef.value?.play();
};

const infoCaptureCard = () => {
  captureCardAudioRef.value?.play();
};

const infoFailCard = () => {
  captureCardFailureAudioRef.value?.play();
};

const infoWinGame = () => {
  muteSFXOnGameEnd();
  winGameAudioRef.value?.play()
}

const infoLoseGame = () => {
  muteSFXOnGameEnd();
  loseGameAudioRef.value?.play()
}

const muteSFXOnGameEnd = () =>{
  captureCardAudioRef.value?.stop();
  captureCardFailureAudioRef.value?.stop();
  lineWarnAudioRef.value?.stop();
  spellCardGrabbedAudioRef.value?.stop();
  startGameAudioRef.value?.stop();
  pauseAudioRef.value?.stop();
}

watch(
  () => gameStore.spellCardGrabbedFlag,
  (val) => {
    if (val) {
      spellCardGrabbedAudioRef.value?.play();
    }
  }
);

const gameStarted = computed(() => gameStore.gameStatus === GameStatus.STARTED)
watch(gameStarted,
  (started) =>{
    if(started){
      startGameAudioRef.value?.play();
    }
  }
)

const gameCountDown = computed(() => gameStore.gameStatus === GameStatus.COUNT_DOWN);
watch(gameCountDown,
  (started) =>{
    if(started){
      startGameAudioRef.value?.play();
    }
  }
)

const gamePaused = computed(() => gameStore.gameStatus === GameStatus.PAUSED);
watch(gamePaused, (paused) => {
  if (paused) {
    pauseAudioRef.value?.play();
  }
});

onMounted(() => {
  ws.on(WebSocketPushActionType.PUSH_GM_WARN_PLAYER, () => {
    spellCardGrabbedAudioRef.value?.stop();
    spellCardGrabbedAudioRef.value?.play();
  });
  // Mit.on("right_link_start", () => {
  //   spellCardGrabbedAudioRef.value?.play();
  // });
});
onUnmounted(() => {
  // Mit.off("right_link_start");
  ws.off(WebSocketPushActionType.PUSH_GM_WARN_PLAYER);
});

watch(
  () => gameStore.gameStatus,
  (value) => {
    if (value === 1 && BGMpaused.value) {
      const score = roomData.value.score[0] + roomData.value.score[1];
      const time = roomStore.roomConfig.countdown - Math.ceil(gameStore.leftTime / 1000);
      switch (score) {
        case 0:
          turn1CountdownAudioRef.value?.setCurrent(time);
          turn1CountdownAudioRef.value?.play();
          break;
        case 1:
          turn2CountdownAudioRef.value?.setCurrent(time);
          turn2CountdownAudioRef.value?.play();
          break;
        case 2:
          turn3CountdownAudioRef.value?.setCurrent(time);
          turn3CountdownAudioRef.value?.play();
          break;
        default:
          turn1CountdownAudioRef.value?.setCurrent(time);
          turn1CountdownAudioRef.value?.play();
      }
    } else {
      stopBGM();
    }
  }
);

defineExpose({ showAlert, hideAlert, warnGamePoint,
    infoCaptureCard, infoFailCard, infoWinGame, infoLoseGame });
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
