import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { useRoomStore } from "./RoomStore";
import { BpStatus, GameData, GameStatus, RoomConfig, Spell, SpellStatus } from "@/types";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";

export const useGameStore = defineStore("game", () => {
  const roomStore = useRoomStore();

  //bigon对局相关
  const spells = ref<Spell[]>([]);
  const spellStatus = ref<SpellStatus[]>([]);
  const leftTime = ref(0);
  const countDownTime = ref(0);
  const gameStatus = ref(0);
  const leftCdTime = ref(0);
  const debugSpellList = ref([]);
  const gameLogs = ref<any[]>([]);

  const playerASelectedIndex = computed(() => spellStatus.value.indexOf(SpellStatus.A_SELECTED));
  const playerBSelectedIndex = computed(() => spellStatus.value.indexOf(SpellStatus.B_SELECTED));
  const inMatch = computed(() => {
    const score = roomStore.roomData.score;
    const totalScore = score[0] + score[1];
    if (totalScore > 0 || banPick.phase > 0 || !!roomStore.roomData.started) {
      return true;
    } else {
      return false;
    }
  });

  const bpGameData = reactive({
    whose_turn: 1, // 轮到谁了，0-左边，1-右边
    ban_pick: 1, // 0-选，1-ban，2-轮到收卡了
    spell_failed_count_a: [1, 2, 3], // 左边玩家25张符卡的失败次数
    spell_failed_count_b: [1, 2, 3], // 右边玩家25张符卡的失败次数
  });

  const linkGameData = reactive({});

  const startGame = () => {
    return ws.send(WebSocketActionType.START_GAME);
  };
  ws.on<RoomConfig>(WebSocketPushActionType.PUSH_START_GAME, (data) => {
    for (const i in data) {
      roomStore.roomConfig[i] = data[i];
    }
  });

  const getGameData = () => {
    return ws.send(WebSocketActionType.GET_ALL_SPELLS).then((data: GameData) => {
      spells.value = data.spells;
      spellStatus.value = data.spell_status;
      leftTime.value = data.left_time;
      gameStatus.value = data.status;
      leftCdTime.value = data.left_cd_time;
      for (const i in data.bp_data) {
        bpGameData[i] = data.bp_data[i];
      }
    });
  };

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
  ws.on<-1 | 0 | 1>(WebSocketPushActionType.PUSH_STOP_GAME, (winner) => {});

  const resetRoom = () => {
    return ws.send(WebSocketActionType.RESET_ROOM);
  };
  ws.on(WebSocketPushActionType.PUSH_RESET_ROOM, () => {});

  const pause = (pause: boolean) => {
    return ws.send(WebSocketActionType.PAUSE, { pause });
  };
  ws.on(WebSocketPushActionType.PUSH_PAUSE, ({ pause }) => {});

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
    return ws.send(WebSocketActionType.FINISH_SPELL, { index, status });
  };
  ws.on<{
    index: number;
    status: number;
    causer: string;
    spell_failed_count_a?: number;
    spell_failed_count_b?: number;
  }>(WebSocketPushActionType.PUSH_UPDATE_SEPLL_STATUS, (data) => {});

  //赛前bp
  const banPick = reactive({
    who_first: 0, // 谁是第一个操作的，0-左边，1-右边
    phase: 0, // BP状态
    a_pick: [] as string[], // 左玩家保了哪些作品
    a_ban: [] as string[], // 左玩家ban了哪些作品
    b_pick: [] as string[], // 右玩家保了哪些作品
    b_ban: [] as string[], // 右玩家ban了哪些作品
    a_open_ex: 0, // 左玩家是否选EX难度
    b_open_ex: 0, // 右玩家是否选EX难度
  });

  const bpStatus = computed(() => {
    if (!banPick.phase) return null;
    switch (banPick.phase) {
      case 1:
      case 3:
        return BpStatus.IS_A_PICK;
      case 2:
      case 4:
        return BpStatus.IS_B_PICK;
      case 5:
      case 8:
      case 9:
        return BpStatus.IS_A_BAN;
      case 6:
      case 7:
      case 10:
        return BpStatus.IS_B_BAN;
      case 11:
        return BpStatus.SELECT_OPEN_EX;
      case 9999:
        return BpStatus.BP_FINISH;
      default:
        return null;
    }
  });

  const startBanPick = (first: 0 | 1 = 0) => {
    return ws.send(WebSocketActionType.START_BAN_PICK, { who_first: first });
  };

  const banPickCard = (selection: string) => {
    return ws.send(WebSocketActionType.BAN_PICK, { selection });
  };
  ws.on(WebSocketPushActionType.PUSH_BAN_PICK, (data) => {
    for (const i in data) {
      banPick[i] = data[i];
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
    banPick,
    playerASelectedIndex,
    playerBSelectedIndex,
    inMatch,
    bpStatus,
    startGame,
    getGameData,
    stopGame,
    resetRoom,
    pause,
    setDebugSeplls,
    selectSpell,
    finishSpell,
    updateSpellStatus,
    startBanPick,
    banPickCard,
  };
});
