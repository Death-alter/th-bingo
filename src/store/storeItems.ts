import { RequestParams, DefaultData, UserData, StoreAction, StoreMutation, MutationHandler } from "@/types";
import Storage from "@/utils/Storage";
import ws from "@/utils/webSocket";
import router from "@/router";
import { ElMessage } from "element-plus";
import store from ".";
import mitt from "@/mitt";

function logSpellCard(status: number, oldStatus: number, index: number) {
  switch (status) {
    case -1:
      store.commit("add_log", [{ text: "符卡" }, { tag: "spellCard", index }, { text: "被禁用了" }]);
      break;
    case 0:
      switch (oldStatus) {
        case 1:
          store.commit("add_log", [{ tag: "playerA" }, { text: "取消选择符卡" }, { tag: "spellCard", index }]);
          break;
        case 3:
          store.commit("add_log", [{ tag: "playerB" }, { text: "取消选择符卡" }, { tag: "spellCard", index }]);
          break;
        default:
          store.commit("add_log", [{ text: "符卡" }, { tag: "spellCard", index }, { text: "被置空了" }]);
      }
      break;
    case 1:
      if (oldStatus === 2) {
        store.commit("add_log", [{ tag: "playerB" }, { text: "取消选择符卡" }, { tag: "spellCard", index }]);
      } else {
        store.commit("add_log", [{ tag: "playerA" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      }
      break;
    case 2:
      if (oldStatus === 1) {
        store.commit("add_log", [{ tag: "playerB" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      } else {
        store.commit("add_log", [{ tag: "playerA" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      }
      break;
    case 3:
      if (oldStatus === 2) {
        store.commit("add_log", [{ tag: "playerA" }, { text: "取消选择符卡" }, { tag: "spellCard", index }]);
      } else {
        store.commit("add_log", [{ tag: "playerB" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
      }
      break;
    case 5:
      if (oldStatus === 3) {
        store.commit("add_log", [{ tag: "playerA" }, { text: "抢了你选择的符卡" }, { tag: "spellCard", index }]);
        mitt.emit("spell_card_grabbed");
      } else {
        store.commit("add_log", [{ tag: "playerA" }, { text: "收取了符卡" }, { tag: "spellCard", index }]);
      }
      break;
    case 7:
      if (oldStatus === 1) {
        store.commit("add_log", [{ tag: "playerB" }, { text: "抢了你选择的符卡" }, { tag: "spellCard", index }]);
        mitt.emit("spell_card_grabbed");
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
      timeMistake: 0,
    },
    dataHandler: {
      replied(res: DefaultData, data: DefaultData, params: RequestParams): DefaultData {
        const newData = { ...data };
        const currentTime = new Date().getTime();
        newData.timeMistake = res.time - currentTime;
        if (params) {
          newData.ping = currentTime - params.time;
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
      } else if (newVal.started === false) {
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
    actionName: "reset_room",
    wsName: "reset_room",
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
    name: "roomData",
    actionName: "change_card_count",
    wsName: "change_card_count",
    default: {},
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
      oldVal.push(log);
      return [...oldVal];
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "start_game",
    wsName: "start_game",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      store.commit("add_log", [
        { text: "符卡抽取完成，" },
        { text: `${res.countdown}秒`, color: "red" },
        { text: "后比赛开始" },
      ]);
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
    actionName: "pause",
    wsName: "pause",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      const obj = { ...data };
      obj.pause_begin_ms = res.pause_begin_ms;
      obj.total_pause_ms = res.total_pause_ms || 0;
      obj.time = res.time;
      return obj;
    },
  },
  {
    name: "gameData",
    actionName: "next_round",
    wsName: "next_round",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      if (res.ban_pick !== undefined) {
        data.ban_pick = res.ban_pick;
      }
      data.status[res.idx] = res.status;
      return { ...data };
    },
  },
  {
    name: "gameData",
    mutationName: "next_round_received",
    wsName: "next_round",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      if (newVal.ban_pick !== undefined) {
        oldVal.ban_pick = newVal.ban_pick;
      }
      if (newVal.whose_turn !== undefined) {
        oldVal.whose_turn = newVal.whose_turn;
      }
      return { ...oldVal };
    }) as MutationHandler,
  },
  {
    name: "gameData",
    mutationName: "pause_received",
    wsName: "pause",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      const obj = { ...oldVal };
      obj.pause_begin_ms = newVal.pause_begin_ms;
      obj.total_pause_ms = newVal.total_pause_ms || 0;
      obj.time = newVal.time;
      return obj;
    }) as MutationHandler,
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
        { text: "符卡抽取完成，你有" },
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
      if (res.ban_pick !== undefined) {
        data.ban_pick = res.ban_pick;
      }
      if (res.whose_turn !== undefined) {
        data.whose_turn = res.whose_turn;
      }
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
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): Promise<DefaultData> => {
      return new Promise((reslove, reject) => {
        const oldStatus = oldVal.status[newVal.idx];
        const status = [...oldVal.status];
        function setData() {
          logSpellCard(status[newVal.idx], oldStatus, newVal.idx);
          const data = { ...oldVal };
          data.status = status;
          reslove(data);
        }

        switch (store.getters.roomData.type) {
          case 1:
            if (store.getters.isPlayerA) {
              if (newVal.status === 2) {
                status[newVal.idx] = newVal.status - 1;
              } else if (newVal.status === 3) {
                status[newVal.idx] = 0;
              } else {
                status[newVal.idx] = newVal.status;
              }
            } else if (store.getters.isPlayerB) {
              if (newVal.status === 2) {
                status[newVal.idx] = newVal.status + 1;
              } else if (newVal.status === 1) {
                status[newVal.idx] = 0;
              } else {
                status[newVal.idx] = newVal.status;
              }
            } else {
              status[newVal.idx] = newVal.status;
            }
            if (store.getters.isHost) {
              if (newVal.status === 1 || (newVal.status === 2 && oldStatus === 3) || newVal.status === 5) {
                window.setTimeout(() => {
                  setData();
                }, store.getters.roomSettings.playerA.delay * 1000);
              }
              if (newVal.status === 3 || (newVal.status === 2 && oldStatus === 1) || newVal.status === 7) {
                window.setTimeout(() => {
                  setData();
                }, store.getters.roomSettings.playerB.delay * 1000);
              }
            } else {
              setData();
            }
            break;
          case 2:
            if (newVal.ban_pick !== undefined) {
              oldVal.ban_pick = newVal.ban_pick;
            }
            if (newVal.whose_turn !== undefined) {
              oldVal.whose_turn = newVal.whose_turn;
            }
            status[newVal.idx] = newVal.status;
            setData();
            break;
          case 3:
            status[newVal.idx] = newVal.status;
            if (
              (oldStatus === 0 && newVal.status === 1) ||
              (oldStatus === 1 && newVal.status === 0) ||
              (oldStatus === 2 && newVal.status === 3) ||
              (oldStatus === 3 && newVal.status === 2)
            ) {
              if (store.getters.isHost) {
                window.setTimeout(() => {
                  mitt.emit("A_link_change", newVal.idx);
                  setData();
                }, store.getters.roomSettings.playerA.delay * 1000);
              } else {
                mitt.emit("A_link_change", newVal.idx);
              }
            } else if (
              (oldStatus === 0 && newVal.status === 3) ||
              (oldStatus === 3 && newVal.status === 0) ||
              (oldStatus === 2 && newVal.status === 1) ||
              (oldStatus === 1 && newVal.status === 2)
            ) {
              if (store.getters.isHost) {
                window.setTimeout(() => {
                  mitt.emit("B_link_change", newVal.idx);
                  setData();
                }, store.getters.roomSettings.playerB.delay * 1000);
              } else {
                mitt.emit("B_link_change", newVal.idx);
              }
            }
            break;
        }
      });
    }) as MutationHandler,
  },
  {
    name: "roomSettings",
    mutationName: "modify_room_settings",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      if (store.getters.isHost) {
        const savedSettings = Storage.local.get("roomSettings");
        const settings = { ...newVal };
        if (savedSettings) {
          settings.gameTimeLimit = savedSettings.gameTimeLimit;
          settings.countDownTime = savedSettings.countDownTime;
          settings.gameTimeLimit[store.getters.roomData.type] = newVal.gameTimeLimit;
          settings.countDownTime[store.getters.roomData.type] = newVal.countDownTime;
        } else {
          const gameTimeLimit = {};
          const countDownTime = {};
          gameTimeLimit[store.getters.roomData.type] = newVal.gameTimeLimit;
          countDownTime[store.getters.roomData.type] = newVal.countDownTime;
          settings.gameTimeLimit = gameTimeLimit;
          settings.countDownTime = countDownTime;
        }
        Storage.local.set("roomSettings", settings);
      }
      return newVal;
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "link_time",
    wsName: "link_time",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      data.link_data = res;
      return { ...data };
    },
  },
  {
    name: "gameData",
    mutationName: "link_data_received",
    wsName: "link_data",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      console.log(newVal);
      oldVal.link_data = newVal;
      return { ...oldVal };
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "set_phase",
    wsName: "set_phase",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      console.log(res);
      return data;
    },
  },
];

export default list;
