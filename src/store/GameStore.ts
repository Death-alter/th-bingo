import { defineStore } from "pinia";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoomStore } from "./RoomStore";
import { BingoType, GameData, GameStatus, RoomConfig, Spell, SpellStatus } from "@/types";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";

interface GameLog {
  index: number;
  status: number;
  oldStatus: number;
  causer: string;
  failCountA?: number;
  failCountB?: number;
  getOnWhichBoard?: number;
}

export const useGameStore = defineStore("game", () => {
  const roomStore = useRoomStore();

  //bingo对局相关
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
  const alreadySelectCard = ref(false);
  const spells2 = ref<Spell[]>([]);
  const currentBoard = ref(0);

  const spellCardGrabbedFlag = ref(false);
  watch(spellCardGrabbedFlag, (val) => {
    if (val) {
      leftCdTime.value = 0;
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

  const linkGameData = reactive({});

  const getGameData = () => {
    return ws
      .send(WebSocketActionType.GET_ALL_SPELLS)
      .then((data: GameData) => {
        spells.value = data.spells;
        spells2.value = data.spells2;
        spellStatus.value = data.spell_status;
        leftTime.value = data.left_time;
        gameStatus.value = data.status;
        leftCdTime.value = data.left_cd_time;
        inited.value = true;
        for (const i in data.bp_data) {
          bpGameData[i] = data.bp_data[i];
        }
        for (const i in data.normal_data) {
          normalGameData[i] = data.normal_data[i];
        }
      })
      .catch(() => {});
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
    spells2.value = [];
    normalGameData.which_board_a = 0;
    normalGameData.which_board_b = 0;
    normalGameData.is_portal_a = [];
    normalGameData.is_portal_b = [];
    normalGameData.get_on_which_board = [];
    currentBoard.value = 0;
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

  const finishSpell = (index: number, success = true, playerIndex?: 0 | 1) => {
    return ws.send(WebSocketActionType.FINISH_SPELL, { index, success, player_index: playerIndex });
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
    which_board_a?: number;
    which_board_b?: number;
    get_on_which_board?: number;
  }>(WebSocketPushActionType.PUSH_UPDATE_SEPLL_STATUS, (data) => {
    const log: GameLog = {
      index: data!.index,
      status: data!.status,
      oldStatus: spellStatus.value[data!.index],
      causer: data!.causer,
    };
    if (data!.spell_failed_count_a) {
      log.failCountA = data!.spell_failed_count_a;
      nextTick(() => {
        bpGameData.spell_failed_count_a[data!.index] = data!.spell_failed_count_a!;
      });
    }
    if (data!.spell_failed_count_b) {
      log.failCountB = data!.spell_failed_count_b;
      nextTick(() => {
        bpGameData.spell_failed_count_b[data!.index] = data!.spell_failed_count_b!;
      });
    }
    if(data!.which_board_a != null){
      normalGameData.which_board_a = data!.which_board_a!;
    }
    if(data!.which_board_b != null){
      normalGameData.which_board_b = data!.which_board_b!;
    }
    if(data!.get_on_which_board){
      log.getOnWhichBoard = data!.get_on_which_board;
      normalGameData.get_on_which_board[data!.index] = data!.get_on_which_board!;
    }
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
                             failCountA,
                             failCountB,
                           }: {
    index: number;
    status: number;
    oldStatus: number;
    causer: string;
    failCountA?: number;
    failCountB?: number;
  }) => {
    let str = "";
    const playerA = `<span style="padding:0 2px;color:var(--A-color)">${roomStore.roomData.names[0]}</span>`;
    const playerB = `<span style="padding:0 2px;color:var(--B-color)">${roomStore.roomData.names[1]}</span>`;
    const host = `<span style="padding:0 2px;font-weight:600">${roomStore.roomData.host}</span>`;
    const curSpellList = computed(() => currentBoard.value == 0 ? spells.value : spells2.value)
    const spellCard = `<span style="padding:0 2px;font-weight:600">
      ${curSpellList.value[index].name}</span>`;

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
      if (roomStore.roomData.type === BingoType.BP) {
        const currentCountA = bpGameData.spell_failed_count_a[index];
        const currentCountB = bpGameData.spell_failed_count_b[index];
        if (failCountA! > currentCountA) {
          return `${playerA}收取符卡${spellCard}失败`;
        }
        if (failCountB! > currentCountB) {
          return `${playerB}收取符卡${spellCard}失败`;
        }
      }
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

  //bp赛
  const bpGameData = reactive({
    whose_turn: 0, // 轮到谁了，0-左边，1-右边
    ban_pick: 1, // 0-选，1-ban，2-轮到收卡了
    spell_failed_count_a: [] as number[], // 左边玩家25张符卡的失败次数
    spell_failed_count_b: [] as number[], // 右边玩家25张符卡的失败次数
  });

  const normalGameData = reactive({
    which_board_a: 0,
    which_board_b: 0,
    is_portal_a: [] as number[],
    is_portal_b: [] as number[],
    get_on_which_board: [] as number[],
  })

  const bpGameBanPick = (index: number) => {
    return ws.send(WebSocketActionType.BP_GAME_BAN_PICK, { idx: index });
  };

  const bpGameNextRound = () => {
    return ws.send(WebSocketActionType.BP_GAME_NEXT_ROUND);
  };
  ws.on<{ whose_turn: number; ban_pick: number }>(WebSocketPushActionType.PUSH_BP_GAME_NEXT_ROUND, (data) => {
    bpGameData.whose_turn = data!.whose_turn;
    bpGameData.ban_pick = data!.ban_pick;
  });

  watch(
    () => normalGameData.which_board_a,
    (newVal, oldVal) => {
      if (roomStore.isPlayerA){
        currentBoard.value = newVal;
      }
    },
    {
      immediate: true,
      deep: true,
    }
  );

  watch(
    () => normalGameData.which_board_b,
    (boardB) => {
      if (roomStore.isPlayerB){
        currentBoard.value = boardB;
      }
    },
    {
      immediate: true,
      deep: true,
    }
  );

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
    bpGameData,
    normalGameData,
    alreadySelectCard,
    spells2,
    currentBoard,
    startGame,
    getGameData,
    stopGame,
    pause,
    setDebugSeplls,
    selectSpell,
    finishSpell,
    updateSpellStatus,
    bpGameBanPick,
    bpGameNextRound,
  };
});
