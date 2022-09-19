import { StoreData, RequestParams } from "@/types";
import { AxiosResponse } from "axios";

export default [
  //common
  {
    name: "action",
    actionName: "FETCH_ACTION",
    url: "",
    method: "socket",
    dataHandler: (
      res: AxiosResponse,
      data: StoreData,
      params: RequestParams
    ) => {
      return data;
    },
    default: {},
  },
  {
    name: "action",
    actionName: "FETCH_ACTION",
    url: "",
    method: "get",
    dataHandler: (
      res: AxiosResponse,
      data: StoreData,
      params: RequestParams
    ) => {
      return data;
    },
    default: {},
  },
  {
    name: "mutation",
    mutationName: "FETCH_MUTATION",
    default: {},
    dataHandler: (newVal: RequestParams, oldVal: StoreData) => {
      return oldVal;
    },
  },
];
