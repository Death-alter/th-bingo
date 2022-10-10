import { RequestParams, DefaultData, UserData, StoreAction, StoreMutation, MutationHandler } from "@/types";
import Storage from "@/utils/Storage";
import ws from "@/utils/webSocket";
import router from "@/router";
import { ElMessage } from "element-plus";

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
    dataHandler(newVal: RequestParams, oldVal: DefaultData) {
      console.log(newVal);
      return newVal;
    },
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
  },
  {
    name: "gameData",
    actionName: "get_spells",
    wsName: "get_spells",
    default: {},
  },
  {
    name: "gameData",
    actionName: "stop_game",
    wsName: "stop_game",
    default: {},
  },

  {
    name: "roomSettings",
    mutationName: "modify_room_settings",
    default: {},
  },
];

export default list;
