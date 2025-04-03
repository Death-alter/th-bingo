import { defineStore } from "pinia";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoomStore } from "./RoomStore";
import { GameData, GameStatus, RoomConfig, Spell, SpellStatus } from "@/types";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";

interface GameLog {
  index: number;
  status: number;
  oldStatus: number;
  causer: string;
  failCountA?: number;
  failCountB?: number;
}

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
  const gameLogs = reactive<string[]>([]);
  const winner = ref<-1 | 0 | 1 | undefined | null>(null);
  const inited = ref(false);

  const spellCardGrabbedFlag = ref(false);
  watch(spellCardGrabbedFlag, (val) => {
    if (val) {
      nextTick(() => {
        spellCardGrabbedFlag.value = false;
      });
    }
  });

  const bothSelectedIndex = computed(() => spellStatus.value.indexOf(SpellStatus.BOTH_SELECTED));
  const playerASelectedIndex = computed(() =>
    bothSelectedIndex.value === -1 ? spellStatus.value.indexOf(SpellStatus.A_SELECTED) : bothSelectedIndex.value
  );
  const playerBSelectedIndex = computed(() =>
    bothSelectedIndex.value === -1 ? spellStatus.value.indexOf(SpellStatus.B_SELECTED) : bothSelectedIndex.value
  );

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
    const log: GameLog = {
      index: data!.index,
      status: data!.status,
      oldStatus: spellStatus.value[data!.index],
      causer: data!.causer,
    };
    if (data!.spell_failed_count_a) log.failCountA = data!.spell_failed_count_a;
    if (data!.spell_failed_count_b) log.failCountB = data!.spell_failed_count_b;
    const logText = getSepllCardLog(log);
    gameLogs.push(logText);

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

  const getSepllCardLog = ({
    index,
    status,
    oldStatus,
    causer,
    spell_failed_count_a,
    spell_failed_count_b,
  }: {
    index: number;
    status: number;
    oldStatus: number;
    causer: string;
    spell_failed_count_a?: number;
    spell_failed_count_b?: number;
  }) => {
    let str = "";
    const playerA = `<span style="padding:0 2px;color:var(--A-color)">${causer}</span>`;
    const playerB = `<span style="padding:0 2px;color:var(--B-color)">${causer}</span>`;
    const host = `<span style="padding:0 2px;font-weight:600">${causer}</span>`;
    const spellCard = `<span style="padding:0 2px;font-weight:600">${spells.value[index].name}</span>`;

    if (roomStore.roomData.names[0] === causer) {
      str += playerA;
      switch (status) {
        case -1:
          str += "禁用了符卡";
          break;
        case 0:
        case 3:
          if (roomStore.isPlayerA) {
            if (oldStatus === 5) {
              str += "取消收取符卡";
            } else {
              str += "取消选择符卡";
            }
          }
          break;
        case 1:
        case 2:
          str += "选择了符卡";
          break;
        case 5:
          if (roomStore.isPlayerB && (oldStatus === 3 || oldStatus === 2)) {
            str += "抢了你选择的符卡";
            spellCardGrabbedFlag.value = true;
          } else {
            str += "收取了符卡";
          }
          break;
      }
      str += spellCard;
    } else if (roomStore.roomData.names[1] === causer) {
      str += playerB;
      switch (status) {
        case -1:
          str += "禁用了符卡";
          break;
        case 0:
        case 1:
          if (roomStore.isPlayerB) {
            if (oldStatus === 7) {
              str += "取消收取符卡";
            } else {
              str += "取消选择符卡";
            }
          }
          break;
        case 2:
        case 3:
          str += "选择了符卡";
          break;
        case 7:
          if (roomStore.isPlayerA && (oldStatus === 1 || oldStatus === 2)) {
            str += "抢了你选择的符卡";
            spellCardGrabbedFlag.value = true;
          } else {
            str += "收取了符卡";
          }
          break;
      }
      str += spellCard;
    } else {
      str = `${host}把符卡${spellCard}`;
      switch (status) {
        case -1:
          str += "设置为禁用";
          break;
        case 0:
          str += "状态置空";
          break;
        case 1:
          str += `设置为${playerA}选择`;
          break;
        case 2:
          str += "设置为双方选择";
          break;
        case 3:
          str += `设置为${playerB}选择`;
          break;
        case 5:
          str += `设置为${playerA}收取`;
          break;
        case 6:
          str += "设置为双方收取";
          break;
        case 7:
          str += `设置为${playerB}收取`;
          break;
      }
    }

    return str;
  };

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
    spellCardGrabbedFlag,
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
