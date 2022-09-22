import { StoreData, RequestParams } from "@/types";
import { AxiosResponse } from "axios";
import { UserData, StoreAction, StoreMutation } from "@/types";
import Storage from "@/utils/Storage";

const list: Array<StoreAction | StoreMutation> = [
  {
    name: "userData",
    mutationName: "LOGIN",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: StoreData) => {
      const userData: UserData | null = Storage.local.get("userData");
      if (!userData) {
        return oldVal;
      } else {
        return {
          data: userData,
        };
      }
    },
  },
  {
    name: "userData",
    mutationName: "LOGOUT",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: StoreData) => {
      return { data: {} };
    },
  },
  {
    name: "roomData",
    actionName: "CREATE_ROOM",
    url: "",
    method: "socket",
    default: {},
    dataHandler: (
      res: AxiosResponse,
      data: StoreData,
      params: RequestParams
    ) => {
      return data;
    },
  },
  {
    name: "roomData",
    actionName: "JOIN_ROOM",
    url: "",
    method: "socket",
    default: {},
    dataHandler: (
      res: AxiosResponse,
      data: StoreData,
      params: RequestParams
    ) => {
      return data;
    },
  },
  {
    name: "roomData",
    actionName: "LEAVE_ROOM",
    url: "",
    method: "socket",
    default: {},
    dataHandler: (
      res: AxiosResponse,
      data: StoreData,
      params: RequestParams
    ) => {
      return data;
    },
  },
];

export default list;
