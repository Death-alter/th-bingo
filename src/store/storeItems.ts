import { RequestParams, DefaultData, UserData, StoreAction, StoreMutation, MutationHandler } from "@/types";
import Storage from "@/utils/Storage";
import ws from "@/utils/webSocket";
import router from "@/router";
import { ElMessage } from "element-plus";
import store from ".";
import mitt from "@/mitt";

function logSpellCard(status: number, oldStatus: number, index: number, trigger?: string) {
  if (store.getters.roomData.names && store.getters.roomData.names[0] === trigger) {
    switch (status) {
      case -1:
        store.commit("add_log", [{ tag: "playerA" }, { text: "禁用了符卡" }, { tag: "spellCard", index }]);
        break;
      case 0:
      case 3:
        if (store.getters.isPlayerA) {
          if (oldStatus === 5) {
            store.commit("add_log", [{ tag: "playerA" }, { text: "取消收取符卡" }, { tag: "spellCard", index }]);
          } else {
            store.commit("add_log", [{ tag: "playerA" }, { text: "取消选择符卡" }, { tag: "spellCard", index }]);
          }
        }
        break;
      case 1:
      case 2:
        store.commit("add_log", [{ tag: "playerA" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
        break;
      case 5:
        if (store.getters.isPlayerB && (oldStatus === 3 || oldStatus === 2)) {
          store.commit("add_log", [{ tag: "playerA" }, { text: "抢了你选择的符卡" }, { tag: "spellCard", index }]);
          mitt.emit("spell_card_grabbed");
        } else {
          store.commit("add_log", [{ tag: "playerA" }, { text: "收取了符卡" }, { tag: "spellCard", index }]);
        }
        break;
    }
  } else if (store.getters.roomData.names && store.getters.roomData.names[1] === trigger) {
    switch (status) {
      case -1:
        store.commit("add_log", [{ tag: "playerB" }, { text: "禁用了符卡" }, { tag: "spellCard", index }]);
        break;
      case 0:
      case 1:
        if (store.getters.isPlayerB) {
          if (oldStatus === 7) {
            store.commit("add_log", [{ tag: "playerB" }, { text: "取消收取符卡" }, { tag: "spellCard", index }]);
          } else {
            store.commit("add_log", [{ tag: "playerB" }, { text: "取消选择符卡" }, { tag: "spellCard", index }]);
          }
        }
        break;
      case 2:
      case 3:
        store.commit("add_log", [{ tag: "playerB" }, { text: "选择了符卡" }, { tag: "spellCard", index }]);
        break;
      case 7:
        if (store.getters.isPlayerA && (oldStatus === 1 || oldStatus === 2)) {
          store.commit("add_log", [{ tag: "playerB" }, { text: "抢了你选择的符卡" }, { tag: "spellCard", index }]);
          mitt.emit("spell_card_grabbed");
        } else {
          store.commit("add_log", [{ tag: "playerB" }, { text: "收取了符卡" }, { tag: "spellCard", index }]);
        }
        break;
    }
  } else {
    switch (status) {
      case -1:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "设置为禁用" },
        ]);
        break;
      case 0:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "状态置空" },
        ]);
        break;
      case 1:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "设置为" },
          { tag: "playerA" },
          { text: "选择" },
        ]);
        break;
      case 2:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "设置为双方选择" },
        ]);
        break;
      case 3:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "设置为" },
          { tag: "playerB" },
          { text: "选择" },
        ]);
        break;
      case 5:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "设置为" },
          { tag: "playerA" },
          { text: "收取" },
        ]);
        break;
      case 6:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "设置为双方收取" },
        ]);
        break;
      case 7:
        store.commit("add_log", [
          { tag: "host" },
          { text: "把符卡" },
          { tag: "spellCard", index },
          { text: "设置为" },
          { tag: "playerB" },
          { text: "收取" },
        ]);
        break;
    }
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
        if (res) {
          router.push(`/room/${res.rid}`);
        }
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
            case "host":
              item.style.fontWeight = 600;
              item.text = store.getters.roomData.host;
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
      let num = 0;
      for (const item of res.status) {
        if (item === (store.getters.isPlayerA ? 7 : 5)) {
          num++;
        }
      }
      if (num >= 5 || res.phase === 1) {
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
      return res;
    },
  },
  {
    name: "roomData",
    actionName: "sit_down",
    wsName: "sit_down",
    default: {},
  },
  {
    name: "roomData",
    actionName: "stand_up",
    wsName: "stand_up",
    default: {},
  },
  {
    name: "gameData",
    actionName: "pause",
    wsName: "pause",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      const obj = { ...data };
      obj.pause_begin_ms = res.pause_begin_ms;
      obj.total_pause_time = res.total_pause_time || 0;
      obj.time = res.time;
      if (res.pause_begin_ms) {
        mitt.emit("game_phase");
      }
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
      obj.total_pause_time = newVal.total_pause_time || 0;
      obj.time = newVal.time;
      if (newVal.pause_begin_ms) {
        mitt.emit("game_phase");
      }
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
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams, trigger): DefaultData => {
      if (res.ban_pick !== undefined) {
        data.ban_pick = res.ban_pick;
      }
      if (res.whose_turn !== undefined) {
        data.whose_turn = res.whose_turn;
      }
      logSpellCard(params.status, data.status[params.idx], params.idx, store.getters.userData.userName);
      let num = 0;
      for (const item of data.status) {
        if (item === (store.getters.isPlayerA ? 7 : 5)) {
          num++;
        }
      }
      if (num >= 5 || store.getters.gameData.phase === 1) {
        data.status[params.idx] = params.status;
      } else {
        data.status[params.idx] = res.status;
      }

      return { ...data };
    },
  },
  {
    name: "gameData",
    mutationName: "update_spell_received",
    wsName: "update_spell",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData, trigger: string): Promise<DefaultData> => {
      return new Promise((reslove, reject) => {
        const index = newVal.idx;
        const newStatus = newVal.status;
        let oldStatus = oldVal.status[index];

        function setData() {
          const statusList = store.getters.gameData.status;
          statusList[index] = newStatus;
          logSpellCard(statusList[index], oldStatus, index, trigger);
          const data = { ...oldVal };
          data.status = statusList;
          reslove(data);
        }

        switch (store.getters.roomData.type) {
          case 1:
            if (store.getters.isHost) {
              if (store.getters.roomData.names && store.getters.roomData.names[0] === trigger) {
                window.setTimeout(() => {
                  oldStatus = store.getters.gameData.status[index];
                  setData();
                }, store.getters.roomSettings.playerA.delay * 1000);
              }
              if (store.getters.roomData.names && store.getters.roomData.names[1] === trigger) {
                window.setTimeout(() => {
                  oldStatus = store.getters.gameData.status[index];
                  setData();
                }, store.getters.roomSettings.playerB.delay * 1000);
              }
            } else if (store.getters.isWatcher) {
              setData();
            } else {
              let num = 0;
              for (const item of oldVal.status) {
                if (item === (store.getters.isPlayerA ? 7 : 5)) {
                  num++;
                }
              }
              if (num >= 5 || store.getters.gameData.phase === 1) {
                if (newStatus === 0 || newStatus === 5 || newStatus === 7) {
                  setData();
                }
              } else {
                setData();
              }
            }
            break;
          case 2:
            if (newVal.ban_pick !== undefined) {
              oldVal.ban_pick = newVal.ban_pick;
            }
            if (newVal.whose_turn !== undefined) {
              oldVal.whose_turn = newVal.whose_turn;
            }
            setData();
            break;
          case 3:
            console.log(oldVal);
            if (store.getters.roomData.names && store.getters.roomData.names[0] === trigger) {
              if (store.getters.isHost) {
                window.setTimeout(() => {
                  oldStatus = store.getters.gameData.status[index];
                  setData();
                  mitt.emit("A_link_change", index);
                }, store.getters.roomSettings.playerA.delay * 1000);
              } else {
                if (oldVal.phase > 1) {
                  setData();
                }
                mitt.emit("A_link_change", index);
              }
            } else if (store.getters.roomData.names && store.getters.roomData.names[1] === trigger) {
              if (store.getters.isHost) {
                window.setTimeout(() => {
                  oldStatus = store.getters.gameData.status[index];
                  setData();
                  mitt.emit("B_link_change", index);
                }, store.getters.roomSettings.playerB.delay * 1000);
              } else {
                if (oldVal.phase > 1) {
                  setData();
                }
                mitt.emit("B_link_change", index);
              }
            } else {
              setData();
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
      const savedSettings = Storage.local.get("roomSettings");
      const settings = { ...newVal };
      if (savedSettings) {
        settings.gameTimeLimit = savedSettings.gameTimeLimit;
        settings.countDownTime = savedSettings.countDownTime;
        if (store.getters.roomData && store.getters.roomData.type) {
          settings.gameTimeLimit[store.getters.roomData.type] = newVal.gameTimeLimit;
          settings.countDownTime[store.getters.roomData.type] = newVal.countDownTime;
        }
      } else {
        const gameTimeLimit = {};
        const countDownTime = {};
        if (store.getters.roomData && store.getters.roomData.type) {
          gameTimeLimit[store.getters.roomData.type] = newVal.gameTimeLimit;
          countDownTime[store.getters.roomData.type] = newVal.countDownTime;
        }
        settings.gameTimeLimit = gameTimeLimit;
        settings.countDownTime = countDownTime;
      }
      Storage.local.set("roomSettings", settings);
      return newVal;
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "link_time",
    wsName: "link_time",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      const newData = { ...data };
      newData.link_data = res;
      return newData;
    },
  },
  {
    name: "gameData",
    mutationName: "link_data_received",
    wsName: "link_data",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      const data = { ...oldVal };
      data.link_data = newVal;
      return data;
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "set_phase",
    wsName: "set_phase",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      const newData = { ...data };
      newData.phase = res.phase;
      return newData;
    },
  },
  {
    name: "gameData",
    mutationName: "set_phase_received",
    wsName: "set_phase",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      const data = { ...oldVal };
      data.phase = newVal.phase;
      return data;
    }) as MutationHandler,
  },
];

export default list;
