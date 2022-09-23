import request from "@/utils/request";
import ws from "@/utils/webSocket";
import {
  VuexState,
  StoreData,
  ActionHandler,
  MutationHandler,
  RequestParams,
} from "@/types";
import { Store } from "vuex";
import store from "./index";

export const createGetter = (name: string, defaultValue: any, type: string) => {
  if (type === "status") {
    return (state: VuexState) => state[name].status || defaultValue;
  } else {
    return (state: VuexState) => state[name].data || defaultValue;
  }
};

export const createAsyncMutations = (name: string, actionName: string) => {
  const obj = {};
  obj[actionName + "_pending"] = (state: VuexState) => {
    if (!state[name]) {
      state[name] = {
        status: "pending",
        data: null,
      };
    } else {
      state[name].status = "pending";
    }
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_pending");
    }
  };
  obj[actionName + "_success"] = (state: VuexState, data: any) => {
    const newVal: StoreData = {
      status: "success",
    };
    if (data) {
      newVal.data = data;
    }
    state[name] = newVal;
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_success");
    }
  };
  obj[actionName + "_failure"] = (state: VuexState, error: string) => {
    const newVal: StoreData = {
      status: "failure",
    };
    if (error) {
      newVal.error = error;
    }
    state[name] = newVal;
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_failure");
    }
  };
  return obj;
};

export const createSyncMutation =
  (name: string, callback: MutationHandler) =>
  (state: VuexState, data: RequestParams) => {
    if (callback) {
      state[name] = callback(data, state[name]);
    } else {
      state[name] = { data };
    }
  };

export const createAction = (
  name: string,
  actionName: string,
  wsName: string,
  callback: ActionHandler
) => {
  ws.on(wsName, (data) => {
    store.commit("");
  });

  return ({ commit, state }: Store<any>, data: RequestParams) => {
    if (state[name].status !== "pending") {
      commit(actionName + "_pending");
      ws.send(wsName, data);
    }
  };
};
