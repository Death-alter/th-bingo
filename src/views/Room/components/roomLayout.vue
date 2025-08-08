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
              :validOperations="validOperations"
              :disabled="!validOperations || validOperations.length === 0 || !inGame"
            >
              <div class="bingo-items">
                <template v-if="gameStore.spells">
                  <div class="spell-card" v-for="(item, index) in gameStore.spells" :key="index">
                    <spell-card-cell
                      :spell-data="item"
                      :reverse-spell-data="gameStore.dualPageGameData?.extra_spells[index]"
                      :failCountA="gameStore.bpGameData.spell_failed_count_a[index]"
                      :failCountB="gameStore.bpGameData.spell_failed_count_b[index]"
                      @click="selectSpellCard(index)"
                      :selected="selectedSpellIndex === index"
                      :status="gameStore.spellStatus[index]"
                      :index="index"
                      :showLevel="isBingoBp"
                    ></spell-card-cell>
                  </div>
                </template>
              </div>
            </right-click-menu>
            <game-alert ref="gameAlertRef" />
            <game-bp v-if="isBpPhase" v-model="bpCode"></game-bp>
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
          <template v-if="isBpPhase">
            <el-button
              type="primary"
              v-if="isHost || (isOwner && banPick.phase === 9999)"
              @click="bpFinish"
              :disabled="banPick.phase < 99"
            >
              抽取符卡
            </el-button>
            <template v-if="isPlayer">
              <el-button
                type="primary"
                v-if="banPick.phase < 11"
                :disabled="!(isPlayerA && playerACanBP) && !(isPlayerB && playerBCanBP)"
                @click="playerBanPick"
                >确定</el-button
              >
              <el-button type="primary" v-if="banPick.phase === 11" @click="confirmOpenEX(true)">开启</el-button>
              <el-button type="primary" v-if="banPick.phase === 11" @click="confirmOpenEX(false)">不开启</el-button>
            </template>
          </template>

          <slot v-else name="button-center"></slot>
        </div>
        <div class="sub-button">
          <el-button :disabled="bpStatus !== 5" size="small" v-if="isBpPhase && isOwner" @click="startBP"
            >重新BP</el-button
          >
          <slot v-else name="button-right-1"></slot>
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

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import SpellCardCell from "@/components/spell-card-cell.vue";
import RightClickMenu from "@/components/right-click-menu.vue";
import GameAlert from "./gameAlert.vue";
import GameBp from "@/components/game-bp.vue";
import { ElRow, ElCol, ElButton, ElMessageBox } from "element-plus";
import bgm from "@/components/bgm.vue";
import { useRoomStore } from "@/store/RoomStore";
import { useGameStore } from "@/store/GameStore";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketPushActionType } from "@/utils/webSocket/types";
import { BingoType, BpStatus, GameStatus, MenuOperationType, SpellStatus } from "@/types";

const roomStore = useRoomStore();
const gameStore = useGameStore();

const props = withDefaults(
  defineProps<{
    validOperations: MenuOperationType[];
    multiple?: boolean;
  }>(),
  { validOperations: () => [], multiple: false }
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

const roomSettings = computed(() => roomStore.roomSettings);
const muted = computed(() => roomStore.roomSettings.bgmMuted);
const roomData = computed(() => roomStore.roomData);
const isWatcher = computed(() => roomStore.isWatcher);
const isPlayer = computed(() => roomStore.isPlayer);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);
const isHost = computed(() => roomStore.isHost);
const isOwner = computed(() => (soloMode.value ? isPlayerA.value : isHost.value));
const inGame = computed(() => roomStore.inGame);
const soloMode = computed(() => {
  return roomStore.soloMode;
});
const needWin = computed(() => roomStore.roomConfig.need_win);
const isBingoBp = computed(() => roomData.value.type === BingoType.BP);
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
      if (
        (isPlayerA.value && gameStore.spellStatus[index][1] === SpellStatus.NONE) ||
        (isPlayerB.value && gameStore.spellStatus[index][3] === SpellStatus.NONE)
      ) {
        selectedSpellIndex.value = index;
      }
    } else {
      if (gameStore.spellStatus[index][1] === SpellStatus.NONE && gameStore.spellStatus[index][3] === SpellStatus.NONE)
        selectedSpellIndex.value = index;
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
  gameAlertRef.value?.show(text, color);
};
const hideAlert = () => {
  gameAlertRef.value?.hide();
};

const warnGamePoint = () => {
  gamePointAudioRef.value?.play();
};

watch(
  () => gameStore.spellCardGrabbedFlag,
  (val) => {
    if (val) {
      spellCardGrabbedAudioRef.value?.play();
    }
  }
);

const gamePaused = computed(() => gameStore.gameStatus === GameStatus.PAUSED);
watch(gamePaused, (paused) => {
  if (paused) {
    spellCardGrabbedAudioRef.value?.play();
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

//赛前BP
const bpCode = ref("");
const bpStatus = computed(() => roomStore.bpStatus);
const banPick = computed(() => roomStore.banPick);
const playerACanBP = computed(
  () =>
    bpStatus.value === BpStatus.IS_A_BAN ||
    bpStatus.value === BpStatus.IS_A_PICK ||
    bpStatus.value === BpStatus.SELECT_OPEN_EX
);
const playerBCanBP = computed(
  () =>
    bpStatus.value === BpStatus.IS_B_BAN ||
    bpStatus.value === BpStatus.IS_B_PICK ||
    bpStatus.value === BpStatus.SELECT_OPEN_EX
);

const startBP = () => {
  roomStore.startBanPick();
};
const playerBanPick = () => {
  if (!bpCode.value) {
    ElMessageBox.confirm("你没有选择作品，是否确认不选择？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        roomStore.banPickCard("");
      })
      .catch(() => {});
  } else {
    roomStore.banPickCard(bpCode.value);
  }
};
const confirmOpenEX = (flag: boolean) => {
  if (flag) {
    roomStore.banPickCard("1");
  } else {
    roomStore.banPickCard("-1");
  }
};
const bpFinish = () => {
  gameStore.startGame().then(() => {
    roomStore.updateChangeCardCount(roomData.value.names[0], roomSettings.value.playerA.changeCardCount);
    roomStore.updateChangeCardCount(roomData.value.names[1], roomSettings.value.playerB.changeCardCount);
    hideAlert();
  });
};

onMounted(() => {
  if (!inGame.value) {
    if (soloMode.value) {
      if (!isBpPhase.value) showAlert("等待左侧玩家开始比赛", "#000");
    } else {
      if (!isBpPhase.value) showAlert("等待房主开始比赛", "#000");
    }
  } else {
    hideAlert();
  }
});
const isBpPhase = computed(
  () => roomStore.banPick.phase > 0 && (roomStore.banPick.phase < 99 || gameStore.gameStatus === GameStatus.NOT_STARTED)
);
watch(
  isBpPhase,
  (value) => {
    if (value) {
      hideAlert();
    }
  },
  {
    immediate: true,
  }
);
watch([inGame, isBpPhase], ([inGame, isBpPhase]) => {
  if (!inGame && !isBpPhase) {
    if (soloMode.value) {
      showAlert("等待左侧玩家开始比赛", "#000");
    } else {
      showAlert("等待房主开始比赛", "#000");
    }
  } else {
    hideAlert();
  }
});

defineExpose({ showAlert, hideAlert, warnGamePoint, startBP });
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
