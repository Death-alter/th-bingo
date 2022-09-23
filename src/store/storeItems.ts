import { StoreData, RequestParams } from "@/types";
import { AxiosResponse } from "axios";
import { UserData, StoreAction, StoreMutation } from "@/types";
import Storage from "@/utils/Storage";

const list: Array<StoreAction | StoreMutation> = [
  {
    name: "userData",
    mutationName: "login",
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
    mutationName: "logout",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: StoreData) => {
      return { data: {} };
    },
  },
  {
    name: "roomData",
    actionName: "create_room",
    wsName: "",
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
    actionName: "join_room",
    wsName: "",
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
    actionName: "leave_room",
    wsName: "",
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
