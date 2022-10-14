import { RequestParams, DefaultData, UserData, StoreAction, StoreMutation, MutationHandler } from "@/types";
import Storage from "@/utils/Storage";
import ws from "@/utils/webSocket";
import router from "@/router";
import { ElMessage } from "element-plus";
import store from ".";

function logSpellCard(status: number, oldStatus: number, index: number) {
  switch (status) {
    case 1:
      store.commit("add_log", [{ tag: "playerA" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      break;
    case 2:
      if (oldStatus === 1) {
        store.commit("add_log", [{ tag: "playerB" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      } else {
        store.commit("add_log", [{ tag: "playerA" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      }
      break;
    case 3:
      store.commit("add_log", [{ tag: "playerB" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      break;
    case 5:
      if (oldStatus === 3) {
        store.commit("add_log", [{ tag: "playerA" }, { text: "抢了你选择的符卡" }, { tag: "spellCard", index }]);
      } else {
        store.commit("add_log", [{ tag: "playerA" }, { text: "收取了符卡" }, { tag: "spellCard", index }]);
      }
      break;
    case 7:
      if (oldStatus === 1) {
        store.commit("add_log", [{ tag: "playerB" }, { text: "抢了你选择的符卡"  }, { tag: "spellCard", index }]);
      } else {
        store.commit("add_log", [{ tag: "playerB" }, { text: "收取了符卡" }, { tag: "spellCard", index }]);
      }

      break;
  }
}

const list: Array<StoreAction | StoreMutation> = [
  {
    name: "userData",
    mutationName: "get_user_data",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: DefaultData): DefaultData => {
      const userData: UserData | null = Storage.local.get("userData");
      if (!userData) {
        return oldVal;
      } else {
        return userData;
      }
    },
  },
  {
    name: "userData",
    mutationName: "set_user_data",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: DefaultData): DefaultData => {
      Storage.local.set("userData", newVal);
      return newVal;
    },
  },
  {
    name: "userData",
    mutationName: "remove_user_data",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: DefaultData): DefaultData => {
      Storage.local.remove("userData");
      return {};
    },
  },
  {
    name: "heartBeat",
    actionName: "heart_beat",
    wsName: "heart",
    noParams: true,
    default: {
      time: 0, //本地时间戳
      ping: 0, //ping值
    },
    dataHandler: {
      pending(res: DefaultData, data: DefaultData, params: RequestParams) {
        const newData = { ...data };
        newData.time = params.time;
        return newData;
      },
      replied(res: DefaultData, data: DefaultData, params: RequestParams): DefaultData {
        const newData = { ...data };
        if (params) {
          newData.ping = newData.time - params.time;
          newData.time = params.time;
        }
        console.log("ping:", newData.ping);
        return newData;
      },
    },
  },
  {
    name: "roomData",
    actionName: "login",
    wsName: "login",
    default: {},
    dataHandler: {
      replied: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
        router.push("/room");
        return res;
      },
      error: (res: DefaultData, data: DefaultData, params: RequestParams) => {
        ws.closeConnection();
        return res;
      },
    },
  },
  {
    name: "roomData",
    mutationName: "room_info_received",
    wsName: "room_info",
    default: {},
    dataHandler(newVal: DefaultData, oldVal: DefaultData) {
      if (!newVal) {
        router.push("/");
        ElMessage({
          message: "由于房主退出，房间已关闭",
        });
      }
      if (newVal.started === false) {
        store.commit("clear_game_data");
      }
      return newVal;
    },
  },
  {
    name: "globalData",
    mutationName: "global_info_received",
    wsName: "global_info",
    default: {},
  },
  {
    name: "roomData",
    actionName: "create_room",
    wsName: "create_room",
    default: {},
  },
  {
    name: "roomData",
    actionName: "join_room",
    wsName: "join_room",
    default: {},
  },
  {
    name: "roomData",
    actionName: "leave_room",
    wsName: "leave_room",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      return {};
    },
  },
  {
    name: "roomData",
    actionName: "update_room_type",
    wsName: "update_room_type",
    default: {},
  },
  {
    name: "roomData",
    actionName: "update_name",
    wsName: "update_name",
    default: {},
  },
  {
    name: "roomData",
    mutationName: "change_game_state",
    default: {},
    dataHandler: ((newVal: boolean, oldVal: DefaultData): DefaultData => {
      if (newVal !== undefined) {
        oldVal.started = !!newVal;
      } else {
        if (oldVal.started) {
          oldVal.started = false;
        } else {
          oldVal.started = true;
        }
      }
      return oldVal;
    }) as MutationHandler,
  },
  {
    name: "logList",
    mutationName: "add_log",
    default: [],
    dataHandler: ((newVal: Array<any>, oldVal: Array<any>): DefaultData => {
      const log = newVal.map((v, i) => {
        const item: DefaultData = {
          style: {},
          text: v.text || "",
        };
        if (v.tag) {
          item.style.padding = "0 2px";
          switch (v.tag) {
            case "playerA":
              item.style.color = "var(--A-color)";
              item.text = store.getters.roomData.names[0];
              break;
            case "playerB":
              item.style.color = "var(--B-color)";
              item.text = store.getters.roomData.names[1];
              break;
            case "spellCard":
              item.style.fontWeight = 600;
              item.text = store.getters.gameData.spells[v.index].name;
              break;
            default:
          }
        } else if (v.color) {
          item.style.color = v.color;
        }
        return item;
      });
      console.log(log);
      oldVal.push(log);
      return oldVal;
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "start_game",
    wsName: "start_game",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      store.commit("add_log", [{ text: "比赛开始，倒计时" }, { text: `${res.countdown}秒`, color: "red" }]);
      if (!res.status) {
        res.status = new Array(25).fill(0);
      }
      return res;
    },
  },
  {
    name: "gameData",
    actionName: "get_spells",
    wsName: "get_spells",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      if (store.getters.isPlayerA) {
        res.status.forEach((item: number, index: number) => {
          if (item === 2) {
            res.status[index] = item - 1;
          } else if (item === 3) {
            res.status[index] = 0;
          }
        });
      }
      if (store.getters.isPlayerB) {
        res.status.forEach((item: number, index: number) => {
          if (item === 2) {
            res.status[index] = item + 1;
          } else if (item === 1) {
            res.status[index] = 0;
          }
        });
      }
      return res;
    },
  },
  {
    name: "roomData",
    actionName: "stop_game",
    wsName: "stop_game",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      if (res.started === false) {
        store.commit("clear_game_data");
      }
      console.log(res, data);
      return res;
    },
  },
  {
    name: "gameData",
    mutationName: "clear_game_data",
    default: {},
    dataHandler: ((newVal: null, oldVal: DefaultData): DefaultData => {
      return {};
    }) as MutationHandler,
  },
  {
    name: "gameData",
    mutationName: "stop_game_received",
    wsName: "stop_game",
    default: {},
    dataHandler: ((newVal: null, oldVal: DefaultData): DefaultData => {
      store.commit("change_game_state", false);
      store.commit("add_log", [{ text: "比赛已结束" }]);
      return oldVal;
    }) as MutationHandler,
  },
  {
    name: "gameData",
    mutationName: "spell_list_received",
    wsName: "spell_list",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      store.commit("change_game_state", true);
      store.commit("add_log", [
        { text: "比赛开始，你有" },
        { text: `${newVal.countdown}秒`, color: "red" },
        { text: "的时间来进行规划" },
      ]);
      if (!newVal.status) {
        newVal.status = new Array(25).fill(0);
      }
      return newVal;
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "update_spell",
    wsName: "update_spell",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      logSpellCard(params.status, data.status[params.idx], params.idx);
      data.status[params.idx] = params.status;
      return { ...data };
    },
  },
  {
    name: "gameData",
    mutationName: "update_spell_received",
    wsName: "update_spell",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      const oldStatus = oldVal.status[newVal.idx];
      if (store.getters.isPlayerA) {
        if (newVal.status === 1) {
          oldVal.status[newVal.idx] = newVal.status - 1;
        } else if (newVal.status === 3) {
          oldVal.status[newVal.idx] = 0;
        } else {
          oldVal.status[newVal.idx] = newVal.status;
        }
      } else if (store.getters.isPlayerB) {
        if (newVal.status === 2) {
          oldVal.status[newVal.idx] = newVal.status + 1;
        } else if (newVal.status === 1) {
          oldVal.status[newVal.idx] = 0;
        } else {
          oldVal.status[newVal.idx] = newVal.status;
        }
      } else {
        oldVal.status[newVal.idx] = newVal.status;
      }
      logSpellCard(oldVal.status[newVal.idx], oldStatus, newVal.idx);
      return { ...oldVal };
    }) as MutationHandler,
  },
  {
    name: "roomSettings",
    mutationName: "modify_room_settings",
    default: {},
  },
];

export default list;
