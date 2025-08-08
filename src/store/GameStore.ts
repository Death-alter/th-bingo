import { defineStore } from "pinia";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoomStore } from "./RoomStore";
import { BingoType, GameData, GameStatus, RoomConfig, Spell, SpellStatus } from "@/types";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";

interface GameLog {
  index: number;
  status: string;
  oldStatus: string;
  causer: string;
  failCountA?: number;
  failCountB?: number;
}

export const useGameStore = defineStore("game", () => {
  const roomStore = useRoomStore();

  //bigon对局相关
  const spells = ref<Spell[]>([]);
  const spellStatus = ref<string[]>([]);
  const leftTime = ref(0);
  const countDownTime = ref(0);
  const gameStatus = ref(GameStatus.NOT_STARTED);
  const leftCdTime = ref(-1);
  const debugSpellList = ref([]);
  const gameLogs = reactive<string[]>([]);
  const winner = ref<-1 | 0 | 1 | undefined | null>(null);
  const inited = ref(false);
  const alreadySelectCard = ref(false);

  const spellCardGrabbedFlag = ref(false);
  watch(spellCardGrabbedFlag, (val) => {
    if (val) {
      leftCdTime.value = 0;
      nextTick(() => {
        spellCardGrabbedFlag.value = false;
      });
    }
  });
  const playerASelectedIndex = computed(() => {
    for (let i = 0; i < spellStatus.value.length; i++) {
      const status = spellStatus.value[i];
      if (status[1] == SpellStatus.SELECTED) {
        return i;
      }
    }
    return -1;
  });
  const playerBSelectedIndex = computed(() => {
    for (let i = 0; i < spellStatus.value.length; i++) {
      const status = spellStatus.value[i];
      if (status[3] == SpellStatus.SELECTED) {
        return i;
      }
    }
    return -1;
  });

  const linkGameData = reactive({});

  const getGameData = () => {
    return ws
      .send(WebSocketActionType.GET_ALL_SPELLS)
      .then((data: GameData) => {
        spells.value = data.spells;
        spellStatus.value = data.spell_status.map((status: number) => statusToString(status));
        leftTime.value = data.left_time;
        gameStatus.value = data.status;
        leftCdTime.value = data.left_cd_time;
        inited.value = true;
        for (const i in data.bp_data) {
          bpGameData[i] = data.bp_data[i];
        }
        dualPageGameData.player_current_page = data.dual_page_data.player_current_page;
        dualPageGameData.extra_spells = data.dual_page_data.spells2;
      })
      .catch(() => {});
  };

  const statusToString = (status: number) => {
    let str = "";
    while (str.length < 4) {
      str = (status % 10) + str;
      status = Math.floor(status / 10);
    }
    return str;
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
    dualPageGameData.player_current_page = [0, 0];
    dualPageGameData.extra_spells = [];
    page.value = 0;
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

  const updateSpellStatus = (index: number, status: number) => {
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
      status: statusToString(data!.status),
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
    const logText = getSepllCardLog(log);
    gameLogs.push(logText);

    if (roomStore.isHost) {
      if (data!.causer === roomStore.roomData.names[0]) {
        setTimeout(() => {
          spellStatus.value[data!.index] = log.status;
        }, roomStore.roomSettings.playerA.delay * 1000);
      } else if (data!.causer === roomStore.roomData.names[1]) {
        setTimeout(() => {
          spellStatus.value[data!.index] = log.status;
        }, roomStore.roomSettings.playerB.delay * 1000);
      } else {
        spellStatus.value[data!.index] = log.status;
      }
    } else {
      spellStatus.value[data!.index] = log.status;
    }
  });

  const getSepllCardLog = ({ index, status, oldStatus, causer, failCountA, failCountB }: GameLog) => {
    let str = "";
    const playerA = `<span style="padding:0 2px;color:var(--A-color)">${roomStore.roomData.names[0]}</span>`;
    const playerB = `<span style="padding:0 2px;color:var(--B-color)">${roomStore.roomData.names[1]}</span>`;
    const host = `<span style="padding:0 2px;font-weight:600">${roomStore.roomData.host}</span>`;
    const spell1 = `<span style="padding:0 2px;font-weight:600">${spells.value[index].name}</span>`;

    let spellCard: string;
    if (roomStore.roomData.type === BingoType.DUAL_PAGE) {
      const spell2 = `<span style="padding:0 2px;font-weight:600">${dualPageGameData.extra_spells[index]?.name}</span>`;
      if (roomStore.roomData.names[0] === causer) {
        spellCard = status[0] === "0" ? spell1 : spell2;
      } else if (roomStore.roomData.names[1] === causer) {
        spellCard = status[2] === "0" ? spell1 : spell2;
      } else {
        if (status[1] === oldStatus[1]) {
          spellCard = status[2] === "0" ? spell1 : spell2;
        } else if (status[3] === oldStatus[3]) {
          spellCard = status[0] === "0" ? spell1 : spell2;
        } else {
          if (status[1] === SpellStatus.ATTAINED) {
            spellCard = status[0] === "0" ? spell1 : spell2;
          } else {
            spellCard = status[2] === "0" ? spell1 : spell2;
          }
        }
      }
    } else {
      spellCard = spell1;
    }

    if (roomStore.roomData.names[0] === causer) {
      str += playerA;
      switch (status[1]) {
        case SpellStatus.NONE:
          switch (oldStatus[1]) {
            case SpellStatus.SELECTED:
              str += "取消选择符卡";
              break;
            case SpellStatus.ATTAINED:
              str += "取消收取符卡";
              break;
            case SpellStatus.BANNED:
              str += "取消禁用";
              break;
          }
          break;
        case SpellStatus.SELECTED:
          str += "选择了符卡";
          break;
        case SpellStatus.ATTAINED:
          if (roomStore.isPlayerB && oldStatus[3] === SpellStatus.SELECTED) {
            str += "抢了你选择的符卡";
            spellCardGrabbedFlag.value = true;
          } else {
            str += "收取了符卡";
          }
          break;
        case SpellStatus.BANNED:
          str += "禁用了符卡";
          break;
      }
      str += spellCard;
    } else if (roomStore.roomData.names[1] === causer) {
      str += playerB;
      switch (status[3]) {
        case SpellStatus.NONE:
          switch (oldStatus[3]) {
            case SpellStatus.SELECTED:
              str += "取消选择符卡";
              break;
            case SpellStatus.ATTAINED:
              str += "取消收取符卡";
              break;
            case SpellStatus.BANNED:
              str += "取消禁用";
              break;
          }
          break;
        case SpellStatus.SELECTED:
          str += "选择了符卡";
          break;
        case SpellStatus.ATTAINED:
          if (roomStore.isPlayerA && oldStatus[1] === SpellStatus.SELECTED) {
            str += "抢了你选择的符卡";
            spellCardGrabbedFlag.value = true;
          } else {
            str += "收取了符卡";
          }
          break;
        case SpellStatus.BANNED:
          str += "禁用了符卡";
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

      if (status[1] === oldStatus[1]) {
        switch (status[3]) {
          case SpellStatus.NONE:
            if (oldStatus[3] == SpellStatus.SELECTED) {
              str += `${host}取消了${playerB}对符卡${spellCard}的选择`;
            } else if (oldStatus[3] == SpellStatus.ATTAINED) {
              str += `${host}取消了${playerB}对符卡${spellCard}的收取`;
            } else {
              str += `${host}把符卡${spellCard}状态置空`;
            }
            break;
          case SpellStatus.SELECTED:
            str += `${host}添加了${playerB}对符卡${spellCard}的选择`;
            break;
          case SpellStatus.ATTAINED:
            str += `${host}把符卡${spellCard}设置为${playerB}收取`;
            break;
        }
      } else if (status[3] === oldStatus[3]) {
        switch (status[1]) {
          case SpellStatus.NONE:
            if (oldStatus[1] == SpellStatus.SELECTED) {
              str += `${host}取消了${playerA}对符卡${spellCard}的选择`;
            } else if (oldStatus[1] == SpellStatus.ATTAINED) {
              str += `${host}取消了${playerA}对符卡${spellCard}的收取`;
            } else {
              str += `${host}把符卡${spellCard}状态置空`;
            }
            break;
          case SpellStatus.SELECTED:
            str += `${host}添加了${playerA}对符卡${spellCard}的选择`;
            break;
          case SpellStatus.ATTAINED:
            str += `${host}把符卡${spellCard}设置为${playerA}收取`;
            break;
        }
      } else {
        if (status[1] === SpellStatus.ATTAINED) {
          str += `${host}把符卡${spellCard}设置为${playerA}收取`;
        }
        if (status[3] === SpellStatus.ATTAINED) {
          str += `${host}把符卡${spellCard}设置为${playerB}收取`;
        }
        if (status[1] === SpellStatus.BANNED) {
          str += `${host}把符卡${spellCard}设置为禁用`;
        }
        if (oldStatus[1] === SpellStatus.BANNED) {
          str += `${host}把符卡${spellCard}取消禁用`;
        }
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

  //双重盘面
  const dualPageGameData = reactive<{
    player_current_page: number[];
    extra_spells: Spell[];
  }>({
    player_current_page: [0, 0],
    extra_spells: [],
  });
  const page = ref<number>(0);
  const playerAPage = computed(() =>
    dualPageGameData.extra_spells.length ? dualPageGameData.player_current_page[0] : -1
  );
  const playerBPage = computed(() =>
    dualPageGameData.extra_spells.length ? dualPageGameData.player_current_page[1] : -1
  );
  const isSelfPage = computed(() =>
    (roomStore.isPlayerA && page.value === playerAPage.value) || (roomStore.isPlayerB && page.value === playerBPage.value)
  );

  const switchPageLocal = (p: number) => {
    page.value = p;
  };

  const switchPage = () => {
    return ws.send(WebSocketActionType.SWITCH_PAGE, {
      page: roomStore.isPlayerA
        ? 1 - dualPageGameData.player_current_page[0]
        : 1 - dualPageGameData.player_current_page[1],
    });
  };
  ws.on<{
    player_index: number;
    page: number;
  }>(WebSocketPushActionType.PUSH_SWITCH_PAGE, (data) => {
    dualPageGameData.player_current_page[data!.player_index] = data!.page;
    if ((roomStore.isPlayerA && data!.player_index === 0) || (roomStore.isPlayerB && data!.player_index === 1)) {
      page.value = data!.page;
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
    spellCardGrabbedFlag,
    bpGameData,
    dualPageGameData,
    alreadySelectCard,
    page,
    playerAPage,
    playerBPage,
    isSelfPage,
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
    switchPageLocal,
    switchPage,
  };
});
