import { BingoType } from "@/types";
import { defineStore } from "pinia";
import { computed, ref, reactive, watch } from "vue";
import { useLocalStore } from "./LocalStore";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";
import { local } from "@/utils/Storage";
import Config from "@/config";

export const useRoomStore = defineStore("room", () => {
  const localStore = useLocalStore();

  const roomId = ref<string>("");
  const soloMode = ref(false);
  const addRobot = ref(false);

  const inRoom = computed(() => !!roomId.value);
  const inGame = computed(() => roomData.started);
  const isPlayerA = computed(() => roomData.names[0] === localStore.username);
  const isPlayerB = computed(() => roomData.names[1] === localStore.username);
  const isPlayer = computed(() => isPlayerA.value || isPlayerB.value);
  const isWatcher = computed(() => roomData.watchers.indexOf(localStore.username) !== -1);
  const isHost = computed(() => roomData.host === localStore.username);

  const gameTypeList = computed(() => {
    const list = [...Config.gameTypeList];
    list.splice(1, 2);
    return list;
  });

  const roomSettings = reactive({
    type: BingoType.STANDARD,
    gameTimeLimit: gameTypeList.value[0].timeLimit,
    countdownTime: gameTypeList.value[0].countdown,
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

  const roomData = reactive({
    rid: "", // 房间名
    type: 1, // 1-标准赛，2-BP赛，3-link赛
    host: "", // 房主的名字
    names: ["", ""], // 玩家名字列表，一定有2个，没有人则对应位置为空
    change_card_count: [1, 2], // 换卡次数，一定有2个，和上面的names一一对应
    started: false, // 是否已经开始
    score: [1, 2], // 比分，一定有2个，和上面的names一一对应
    watchers: [] as string[], // 观众名字列表，有几个就是几个
    last_winner: 1, // 上一场是谁赢，0或1，-1表示没有上一场
  });

  const createRoom = () => {
    return ws.send(WebSocketActionType.CREATE_ROOM, {
      room_config: {
        rid: roomId.value,
        type: BingoType.STANDARD,
        game_time: roomSettings.gameTimeLimit,
        countdown: roomSettings.countdownTime,
        games: roomSettings.checkList,
        ranks: roomSettings.rankList,
        need_win: (roomSettings.format + 1) / 2,
        difficulty: roomSettings.difficulty,
        cd_time: roomSettings.cdTime,
      },
      solo: soloMode.value,
      add_robot: addRobot.value,
    });
  };

  const getRoomConfig = () => {
    return ws.send(WebSocketActionType.GET_ROOM_CONFIG, { rid: roomId.value });
  };

  const updateRoomConfig = () => {
    saveRoomSettings();
    return ws.send(WebSocketActionType.UPDATE_ROOM_CONFIG, {
      rid: roomId.value,
      type: roomSettings.type,
      game_time: roomSettings.gameTimeLimit,
      countdown: roomSettings.countdownTime,
      games: roomSettings.checkList,
      ranks: roomSettings.rankList,
      need_win: (roomSettings.format + 1) / 2,
      difficulty: roomSettings.difficulty,
      cd_time: roomSettings.cdTime,
    });
  };

  const joinRoom = () => {
    return ws.send(WebSocketActionType.JOIN_ROOM, { rid: roomId.value });
  };

  const leaveRoom = () => {
    return ws.send(WebSocketActionType.LEAVE_ROOM);
  };

  const standUp = () => {
    return ws.send(WebSocketActionType.STAND_UP);
  };

  const sitDown = () => {
    return ws.send(WebSocketActionType.SIT_DOWN);
  };

  ws.on<{ name: string; position: number }>(WebSocketPushActionType.PUSH_JOIN_ROOM, (data) => {
    if (data!.position === -1) {
      roomData.names[data!.position] = data!.name;
    } else {
      roomData.watchers.push(data!.name);
    }
  });

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

  ws.on<{ name: string }>(WebSocketPushActionType.PUSH_STAND_UP, (data) => {
    for (let i = 0; i < roomData.names.length; i++) {
      if (roomData.names[i] === data!.name) {
        roomData.names[i] = "";
        roomData.watchers.push(data!.name);
        return;
      }
    }
  });

  ws.on<{ name: string; position: number }>(WebSocketPushActionType.PUSH_SIT_DOWN, (data) => {
    for (let i = 0; i < roomData.watchers.length; i++) {
      if (roomData.watchers[i] === data!.name) {
        roomData.watchers.splice(i, 1);
        roomData.names[data!.position] = data!.name;
        return;
      }
    }
  });

  return {
    roomId,
    soloMode,
    addRobot,
    roomSettings,
    roomData,
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
    standUp,
    sitDown,
  };
});
