import { RequestParams, DefaultData, UserData, StoreAction, StoreMutation, MutationHandler } from "@/types";
import Storage from "@/utils/Storage";
import ws from "@/utils/webSocket";
import router from "@/router";
import { ElMessage } from "element-plus";
import store from ".";

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
    dataHandler(newVal: RequestParams, oldVal: DefaultData) {
      if (!newVal) {
        router.push("/");
        ElMessage({
          message: "由于房主退出，房间已关闭",
        });
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
    dataHandler: ((newVal: Array<any>, oldVal: DefaultData): DefaultData => {
      for (const item of newVal) {
        oldVal.push(item);
      }
      return oldVal;
    }) as MutationHandler,
  },
  {
    name: "gameData",
    actionName: "start_game",
    wsName: "start_game",
    default: {},
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
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
          if (item === 4 || item === 5) {
            res.status[index] = item - 4;
          }
        });
      }
      if (store.getters.isPlayerB) {
        res.status.forEach((item: number, index: number) => {
          if (item === 1 || item === 5) {
            res.status[index] = item - 1;
          }
        });
      }
      return res;
    },
  },
  {
    name: "gameData",
    actionName: "stop_game",
    wsName: "stop_game",
    default: {},
  },
  {
    name: "gameData",
    mutationName: "stop_game_received",
    wsName: "stop_game",
    default: {},
    dataHandler: ((newVal: null, oldVal: DefaultData): DefaultData => {
      store.commit("change_game_state", false);
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
      data.status[params.idx] = params.status;
      return data;
    },
  },
  {
    name: "gameData",
    mutationName: "update_spell_received",
    wsName: "update_spell",
    default: {},
    dataHandler: ((newVal: DefaultData, oldVal: DefaultData): DefaultData => {
      if (store.getters.isPlayerA) {
        if (newVal.status === 4 || newVal.status === 5) {
          oldVal.status[newVal.idx] = newVal.status - 4;
        }
      } else if (store.getters.isPlayerB) {
        if (newVal.status === 1 || newVal.status === 5) {
          oldVal.status[newVal.idx] = newVal.status - 1;
        }
      } else {
        oldVal.status[newVal.idx] = newVal.status;
      }

      return oldVal;
    }) as MutationHandler,
  },
  {
    name: "roomSettings",
    mutationName: "modify_room_settings",
    default: {},
  },
];

export default list;
