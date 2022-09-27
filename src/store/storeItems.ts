import { RequestParams, defaultData, UserData, StoreAction, StoreMutation } from "@/types";
import Storage from "@/utils/Storage";
import router from "@/router";

const list: Array<StoreAction | StoreMutation> = [
  {
    name: "userData",
    mutationName: "login",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: defaultData): defaultData => {
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
    mutationName: "logout",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: defaultData): defaultData => {
      return {};
    },
  },
  {
    name: "wsTimeOut",
    actionName: "heart_beat",
    wsName: "heart",
    noParams: true,
    default: {
      second: 5,
      time: 0,
      ping: 0,
    },
    dataHandler: {
      pending(res: defaultData, data: defaultData, params: RequestParams) {
        const newData = { ...data };
        newData.time = params.time;
        return newData;
      },
      replied(res: defaultData, data: defaultData, params: RequestParams): defaultData {
        const newData = { ...data };
        if (params) {
          newData.ping = newData.time - params.time;
          newData.time = params.time;
        }
        console.log(newData.ping);
        return newData;
      },
    },
  },
  {
    name: "roomData",
    actionName: "create_room",
    wsName: "create_room",
    default: {},
    dataHandler: {
      replied: (res: defaultData, data: defaultData, params: RequestParams): defaultData => {
        return res;
      },
    },
  },
  {
    name: "roomData",
    actionName: "join_room",
    wsName: "join_room",
    default: {},
    dataHandler: {
      received: (res: defaultData, data: defaultData, params: RequestParams): defaultData => {
        const newData = { ...data };
        newData.names.push[res.name];
        return newData;
      },
    },
  },
  {
    name: "roomData",
    actionName: "leave_room",
    wsName: "leave_room",
    default: {},
    dataHandler: (res: defaultData, data: defaultData, params: RequestParams): defaultData => {
      return data;
    },
  },
];

export default list;
