import { RequestParams, DefaultData, UserData, StoreAction, StoreMutation } from "@/types";
import Storage from "@/utils/Storage";
import ws from "@/utils/webSocket";

const list: Array<StoreAction | StoreMutation> = [
  {
    name: "userData",
    mutationName: "login",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: DefaultData): DefaultData => {
      const userData: UserData | null = Storage.local.get("userData");
      if (!userData) {
        return oldVal;
      } else {
        ws.createConnection();
        return userData;
      }
    },
  },
  {
    name: "userData",
    mutationName: "logout",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: DefaultData): DefaultData => {
      ws.closeConnection();
      return {};
    },
  },
  {
    name: "wsTimeOut",
    actionName: "heart_beat",
    wsName: "heart",
    noParams: true,
    default: {
      second: 3, //发送心跳后多少秒内没收到回复判断掉线
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
        return res;
      },
    },
  },
  {
    name: "roomData",
    actionName: "create_room",
    wsName: "create_room",
    default: {},
    dataHandler: {
      replied: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
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
      received: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
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
    dataHandler: (res: DefaultData, data: DefaultData, params: RequestParams): DefaultData => {
      return data;
    },
  },
];

export default list;
