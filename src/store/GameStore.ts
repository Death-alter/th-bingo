import { defineStore } from "pinia";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoomStore } from "./RoomStore";
import { BpStatus, GameData, GameStatus, RoomConfig, Spell, SpellStatus } from "@/types";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";
import { useLocalStore } from "./LocalStore";

export const useGameStore = defineStore("game", () => {
  const roomStore = useRoomStore();

  //bigon对局相关
  const spells = ref<Spell[]>([]);
  const spellStatus = ref<SpellStatus[]>([]);
  const leftTime = ref(0);
  const countDownTime = ref(0);
  const gameStatus = ref(GameStatus.NOT_STARTED);
  const leftCdTime = ref(-1);
  const debugSpellList = ref([]);
  const gameLogs = ref<any[]>([]);
  const winner = ref<-1 | 0 | 1 | undefined | null>(null);
  const inited = ref(false);

  const playerASelectedIndex = computed(() => spellStatus.value.indexOf(SpellStatus.A_SELECTED));
  const playerBSelectedIndex = computed(() => spellStatus.value.indexOf(SpellStatus.B_SELECTED));

  const bpGameData = reactive({
    whose_turn: 0, // 轮到谁了，0-左边，1-右边
    ban_pick: 1, // 0-选，1-ban，2-轮到收卡了
    spell_failed_count_a: [], // 左边玩家25张符卡的失败次数
    spell_failed_count_b: [], // 右边玩家25张符卡的失败次数
  });

  const linkGameData = reactive({});

  const getGameData = () => {
    return ws.send(WebSocketActionType.GET_ALL_SPELLS).then((data: GameData) => {
      spells.value = data.spells;
      spellStatus.value = data.spell_status;
      leftTime.value = data.left_time;
      gameStatus.value = data.status;
      leftCdTime.value = data.left_cd_time;
      inited.value = true;
      for (const i in data.bp_data) {
        bpGameData[i] = data.bp_data[i];
      }
    });
  };
  watch(
    () => roomStore.roomData.started,
    (started) => {
      if (started) getGameData();
    },
    {
      immediate: true,
    }
  );

  const resetGameData = () => {
    spells.value = [];
    spellStatus.value = [];
    leftTime.value = 0;
    gameStatus.value = GameStatus.NOT_STARTED;
    leftCdTime.value = -1;
    bpGameData.whose_turn = 0;
    bpGameData.ban_pick = 0;
    bpGameData.spell_failed_count_a = [];
    bpGameData.spell_failed_count_b = [];
  };

  const startGame = () => {
    return ws.send(WebSocketActionType.START_GAME);
  };
  ws.on<RoomConfig>(WebSocketPushActionType.PUSH_START_GAME, (data) => {
    for (const i in data) {
      roomStore.roomConfig[i] = data[i];
    }
    roomStore.roomData.started = true;
    roomStore.resetBanPick();
  });

  // const setPhase = (p) => {
  //   phase.value = p;
  //   return ws.send(WebSocketActionType.SET_PHASE, { phase: p });
  // };
  // const getPhase = () => {
  //   return ws.send(WebSocketActionType.GET_PHASE).then(({ phase }) => {
  //     phase.value = phase;
  //   });
  // };

  const stopGame = (winner: -1 | 0 | 1) => {
    return ws.send(WebSocketActionType.STOP_GAME, { winner });
  };
  ws.on<{ winner: -1 | 0 | 1 }>(WebSocketPushActionType.PUSH_STOP_GAME, (data) => {
    winner.value = data!.winner;
    roomStore.roomData.started = false;
    if (data!.winner !== -1) {
      roomStore.roomData.score[data!.winner]++;
    }
    resetGameData();
  });

  const pause = (pause: boolean) => {
    return ws.send(WebSocketActionType.PAUSE, { pause });
  };
  ws.on(WebSocketPushActionType.PUSH_PAUSE, ({ pause }) => {
    if (pause) {
      gameStatus.value = GameStatus.PAUSED;
    } else {
      gameStatus.value = GameStatus.STARTED;
    }
  });

  const setDebugSeplls = () => {
    return ws.send(WebSocketActionType.SET_DEBUG_SPELLS, { spells: debugSpellList.value });
  };

  const selectSpell = (index: number) => {
    return ws.send(WebSocketActionType.SELECT_SPELL, { index });
  };

  const finishSpell = (index: number, success = true) => {
    return ws.send(WebSocketActionType.FINISH_SPELL, { index, success });
  };

  const updateSpellStatus = (index, status) => {
    return ws.send(WebSocketActionType.UPDATE_SPELL_STATUS, { index, status });
  };
  ws.on<{
    index: number;
    status: number;
    causer: string;
    spell_failed_count_a?: number;
    spell_failed_count_b?: number;
  }>(WebSocketPushActionType.PUSH_UPDATE_SEPLL_STATUS, (data) => {
    if (roomStore.isHost) {
      if (data!.causer === roomStore.roomData.names[0]) {
        setTimeout(() => {
          spellStatus.value[data!.index] = data!.status;
        }, roomStore.roomSettings.playerA.delay * 1000);
      } else if (data!.causer === roomStore.roomData.names[1]) {
        setTimeout(() => {
          spellStatus.value[data!.index] = data!.status;
        }, roomStore.roomSettings.playerB.delay * 1000);
      } else {
        spellStatus.value[data!.index] = data!.status;
      }
    } else {
      spellStatus.value[data!.index] = data!.status;
    }
  });

  return {
    spells,
    spellStatus,
    leftTime,
    countDownTime,
    gameStatus,
    leftCdTime,
    debugSpellList,
    gameLogs,
    playerASelectedIndex,
    playerBSelectedIndex,
    inited,
    startGame,
    getGameData,
    stopGame,
    pause,
    setDebugSeplls,
    selectSpell,
    finishSpell,
    updateSpellStatus,
  };
});
