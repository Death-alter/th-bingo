import { BingoType, BpStatus } from "@/types";
import { defineStore } from "pinia";
import { computed, ref, reactive, watch, nextTick } from "vue";
import { useLocalStore } from "./LocalStore";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";
import { local } from "@/utils/Storage";
import Config from "@/config";
import { useRoute, useRouter } from "vue-router";

export const useRoomStore = defineStore("room", () => {
  const localStore = useLocalStore();
  const router = useRouter();

  const roomId = ref<string>("");
  watch(roomId, (id) => {
    if (id) {
      router.push(`/room/${id}`);
    } else {
      router.push(`/`);
    }
  });

  const inRoom = computed(() => isHost.value || isPlayer.value || isWatcher.value);
  const inGame = computed(() => roomData.started);
  const isPlayerA = computed(() => roomData.names[0] === localStore.username);
  const isPlayerB = computed(() => roomData.names[1] === localStore.username);
  const isPlayer = computed(() => isPlayerA.value || isPlayerB.value);
  const isWatcher = computed(() => roomData.watchers.indexOf(localStore.username) !== -1);
  const isHost = computed(() => roomData.host === localStore.username);
  const inMatch = computed(() => {
    const score = roomData.score;
    const totalScore = score[0] + score[1];
    if (totalScore > 0 || banPick.phase > 0 || !!roomData.started) {
      return true;
    } else {
      return false;
    }
  });
  const soloMode = computed(() => !roomData.host);
  const practiceMode = computed(() => !roomData.host && roomData.names[1] === "训练用毛玉");

  const gameTimeLimit = {};
  const countdownTime = {};
  for (const item of Config.gameTypeList) {
    gameTimeLimit[item.type] = item.timeLimit;
    countdownTime[item.type] = item.countdown;
  }

  //本地房间设置
  const roomSettings = reactive({
    type: BingoType.STANDARD,
    gameTimeLimit,
    countdownTime,
    cdTime: 30,
    format: 1,
    checkList: ["6", "7", "8", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
    rankList: ["L", "EX"],
    difficulty: 3,
    bgmMuted: false,
    gamebp: false,
    confirmDelay: 5,
    playerA: {
      color: "hsl(16, 100%, 50%)",
      delay: 5,
      changeCardCount: 2,
    },
    playerB: {
      color: "hsl(210, 100%, 56%)",
      delay: 5,
      changeCardCount: 2,
    },
  });

  //加载本地设置
  const loadRoomSettings = () => {
    const savedSettings = local.get("roomSettings");
    for (const i in savedSettings) {
      roomSettings[i] = savedSettings[i];
    }
  };
  loadRoomSettings();

  const saveRoomSettings = () => {
    local.set("roomSettings", roomSettings);
  };

  //服务端房间设置
  const roomConfig = reactive({
    rid: "", // 房间名
    type: BingoType.STANDARD, // 1-标准赛，2-BP赛，3-link赛
    game_time: 30, // 游戏总时间（不含倒计时），单位：分
    countdown: 5, // 倒计时，单位：秒
    games: [], // 含有哪些作品
    ranks: [], // 含有哪些游戏难度，也就是L卡和EX卡
    need_win: 3, // 需要胜利的局数，例如2表示bo3
    difficulty: 3, // 难度（影响不同星级的卡的分布），1对应E，2对应N，3对应L，其它对应随机
    cd_time: 30, // 选卡cd，收卡后要多少秒才能选下一张卡
    reserved_type: 1, // 纯客户端用的一个类型字段，服务器只负责透传
  });

  const getRoomConfig = () => {
    return ws.send(WebSocketActionType.GET_ROOM_CONFIG, { rid: roomId.value }).then((data) => {
      for (const i in data) {
        roomConfig[i] = data[i];
      }
    });
  };
  watch(roomId, (id) => {
    if (id) getRoomConfig();
  });

  const updateRoomConfig = () => {
    saveRoomSettings();
    return ws.send(WebSocketActionType.UPDATE_ROOM_CONFIG, {
      rid: roomId.value,
      type: roomSettings.type,
      game_time: roomSettings.gameTimeLimit && roomSettings.gameTimeLimit[roomSettings.type],
      countdown: roomSettings.countdownTime && roomSettings.countdownTime[roomSettings.type],
      games: roomSettings.checkList,
      ranks: roomSettings.rankList,
      need_win: (roomSettings.format + 1) / 2,
      difficulty: roomSettings.difficulty,
      cd_time: roomSettings.cdTime,
    });
  };
  ws.on<{ name: string; position: number }>(WebSocketPushActionType.PUSH_UPDATE_ROOM_CONFIG, (data) => {
    for (const i in data) {
      roomConfig[i] = data[i];
      if (roomData.hasOwnProperty(i)) {
        roomData[i] = data[i];
      }
    }
  });

  //房间数据
  const roomData = reactive({
    rid: "", // 房间名
    type: BingoType.STANDARD, // 1-标准赛，2-BP赛，3-link赛
    host: "", // 房主的名字
    names: ["", ""], // 玩家名字列表，一定有2个，没有人则对应位置为空
    change_card_count: [1, 2], // 换卡次数，一定有2个，和上面的names一一对应
    started: false, // 是否已经开始
    score: [0, 0], // 比分，一定有2个，和上面的names一一对应
    watchers: [] as string[], // 观众名字列表，有几个就是几个
    last_winner: -1, // 上一场是谁赢，0或1，-1表示没有上一场
  });
  const setRoomData = (data) => {
    for (const i in data) {
      if (i === "ban_pick") {
        for (const j in data["ban_pick"]) {
          banPick[j] = data["ban_pick"][j];
        }
      } else {
        roomData[i] = data[i];
      }
    }
  };
  const createRoom = (rid: string, soloMode: boolean, addRobot: boolean) => {
    roomSettings.type = BingoType.STANDARD;
    return ws
      .send(WebSocketActionType.CREATE_ROOM, {
        room_config: {
          rid,
          type: BingoType.STANDARD,
          game_time: roomSettings.gameTimeLimit && roomSettings.gameTimeLimit[roomSettings.type],
          countdown: roomSettings.countdownTime && roomSettings.countdownTime[roomSettings.type],
          games: roomSettings.checkList,
          ranks: roomSettings.rankList,
          need_win: (roomSettings.format + 1) / 2,
          difficulty: roomSettings.difficulty,
          cd_time: roomSettings.cdTime,
        },
        solo: soloMode,
        add_robot: addRobot,
      })
      .then((data) => {
        roomId.value = rid;
        setRoomData(data);
      })
      .catch(() => {});
  };
  const getRoomData = () => {
    return ws
      .send(WebSocketActionType.GET_ROOM, { rid: roomId.value })
      .then((data) => {
        if (data) {
          setRoomData(data);
        }
      })
      .catch(() => {});
  };
  watch(roomId, (id) => {
    if (id) {
      getRoomData();
    }
  });

  const joinRoom = (rid: string) => {
    return ws
      .send(WebSocketActionType.JOIN_ROOM, { rid })
      .then((data) => {
        roomId.value = rid;
        for (const i in data) {
          roomData[i] = data[i];
        }
      })
      .catch(() => {});
  };
  ws.on<{ name: string; position: number }>(WebSocketPushActionType.PUSH_JOIN_ROOM, (data) => {
    if (data!.position !== -1) {
      roomData.names[data!.position] = data!.name;
    } else {
      roomData.watchers.push(data!.name);
    }
  });

  const leaveRoom = () => {
    return ws
      .send(WebSocketActionType.LEAVE_ROOM)
      .then(() => {
        roomId.value = "";
        roomData.rid = "";
        roomData.type = BingoType.STANDARD;
        roomData.host = "";
        roomData.names = ["", ""];
        roomData.change_card_count = [1, 2];
        roomData.started = false;
        roomData.score = [0, 0];
        roomData.watchers = [] as string[];
        roomData.last_winner = -1;
      })
      .catch((e) => {});
  };
  ws.on<{ name: string }>(WebSocketPushActionType.PUSH_LEAVE_ROOM, (data) => {
    for (let i = 0; i < roomData.names.length; i++) {
      if (roomData.names[i] === data!.name) {
        roomData.names[i] = "";
        return;
      }
    }
    for (let i = 0; i < roomData.watchers.length; i++) {
      if (roomData.watchers[i] === data!.name) {
        roomData.watchers.splice(i, 1);
        return;
      }
    }
  });

  const resetRoom = () => {
    return ws.send(WebSocketActionType.RESET_ROOM);
  };
  ws.on(WebSocketPushActionType.PUSH_RESET_ROOM, () => {
    getRoomData();
    resetBanPick();
  });

  const standUp = () => {
    return ws.send(WebSocketActionType.STAND_UP);
  };
  ws.on<{ name: string }>(WebSocketPushActionType.PUSH_STAND_UP, (data) => {
    for (let i = 0; i < roomData.names.length; i++) {
      if (roomData.names[i] === data!.name) {
        roomData.names[i] = "";
        roomData.watchers.push(data!.name);
        return;
      }
    }
  });

  const sitDown = () => {
    return ws.send(WebSocketActionType.SIT_DOWN);
  };
  ws.on<{ name: string; position: number }>(WebSocketPushActionType.PUSH_SIT_DOWN, (data) => {
    for (let i = 0; i < roomData.watchers.length; i++) {
      if (roomData.watchers[i] === data!.name) {
        roomData.watchers.splice(i, 1);
        roomData.names[data!.position] = data!.name;
        return;
      }
    }
  });

  const updateChangeCardCount = (name: string, count: number) => {
    return ws.send(WebSocketActionType.UPDATE_CHANGE_CARD_COUNT, { name, count });
  };
  ws.on(WebSocketPushActionType.PUSH_UPDATE_CHANGE_CARD_COUNT, ({ name, count }) => {
    const index = roomData.names.indexOf(name);
    if (index == -1) return;
    roomData.change_card_count[index] = count;
  });

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

  const resetBanPick = () => {
    banPick.who_first = 0;
    banPick.phase = 0;
    banPick.a_pick = [];
    banPick.a_ban = [];
    banPick.b_pick = [];
    banPick.b_ban = [];
    banPick.a_open_ex = 0;
    banPick.b_open_ex = 0;
  };

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
    roomId,
    soloMode,
    practiceMode,
    roomSettings,
    roomData,
    roomConfig,
    inRoom,
    inGame,
    isPlayer,
    isPlayerA,
    isPlayerB,
    isWatcher,
    isHost,
    createRoom,
    updateRoomConfig,
    loadRoomSettings,
    saveRoomSettings,
    joinRoom,
    leaveRoom,
    resetRoom,
    standUp,
    sitDown,
    updateChangeCardCount,
    banPick,
    inMatch,
    bpStatus,
    resetBanPick,
    startBanPick,
    banPickCard,
  };
});
