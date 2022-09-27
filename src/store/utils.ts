import ws from "@/utils/webSocket";
import { VuexState, StoreData, HandlerList, ActionHandler, MutationHandler, RequestParams, defaultData } from "@/types";
import { Md5 } from "ts-md5";
import { ElMessage } from "element-plus";
import { Store } from "vuex";
import store from "./index";

const promisePool: { [index: string]: defaultData } = {};

export const createGetter = (name: string, defaultValue: any, type: string) => {
  if (type === "status") {
    return (state: VuexState) => state[name].status || defaultValue;
  } else {
    return (state: VuexState) => state[name].data || defaultValue;
  }
};

export const createAsyncMutations = (name: string, actionName: string) => {
  const obj = {};
  obj[actionName + "_pending"] = (state: VuexState, data: defaultData) => {
    const newVal: StoreData = {
      status: "pending",
    };
    if (data) {
      newVal.data = data;
    }
    state[name] = newVal;
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_pending");
    }
  };
  obj[actionName + "_replied"] = (state: VuexState, data: defaultData) => {
    const newVal: StoreData = {
      status: "replied",
    };
    if (data) {
      newVal.data = data;
    }
    state[name] = newVal;
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_replied");
    }
  };
  obj[actionName + "_received"] = (state: VuexState, data: defaultData) => {
    const newVal: StoreData = {
      status: "received",
    };
    if (data) {
      newVal.error = data;
    }
    state[name] = newVal;
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_received");
    }
  };
  return obj;
};

export const createSyncMutation = (name: string, callback: MutationHandler) => (
  state: VuexState,
  data: RequestParams
) => {
  if (callback) {
    state[name] = { data: callback(data, state[name].data || {}) };
  } else {
    state[name] = { data };
  }
};

export const createAction = (
  name: string,
  actionName: string,
  wsName: string,
  noParams: boolean = false,
  callback: ActionHandler | HandlerList = (res: defaultData, data: defaultData, params: RequestParams): defaultData => {
    return data;
  }
) => {
  const token = Md5.hashStr(wsName + "_cs");
  let requestParams: RequestParams;
  ws.on(wsName + "_cs", (resName, data) => {
    if (resName === "error_sc") {
      if (!(callback instanceof Function) && "error" in callback && callback.error) {
        data = callback.error(data, store.state[name].data, requestParams);
      }
      ElMessage({
        message: data.msg,
        type: "error",
      });
      promisePool[token].reject(data);
    } else {
      if (callback instanceof Function) {
        data = callback(data, store.state[name].data, requestParams);
      } else if ("replied" in callback && callback.replied) {
        data = callback.replied(data, store.state[name].data, requestParams);
      }
      store.commit(actionName + "_replied", data);
      promisePool[token].resolve(data);
    }
  });

  ws.on(wsName + "_ntf_sc", (resName, data) => {
    if (resName === "error_sc") {
      ElMessage({
        message: data.msg,
        type: "error",
      });
    } else {
      if (callback instanceof Function) {
        data = callback(data, store.state[name].data, requestParams);
      } else if ("received" in callback && callback.received) {
        data = callback.received(data, store.state[name].data, requestParams);
      }
      store.commit(actionName + "_received", data);
    }
  });

  return ({ commit, state }: Store<any>, data: RequestParams) => {
    return new Promise((resolve, reject) => {
      if (state[name].status !== "pending") {
        promisePool[token] = {
          resolve,
          reject,
        };
        requestParams = data;
        if (noParams) {
          ws.send(wsName + "_cs");
        } else {
          ws.send(wsName + "_cs", data);
        }
        if ("replied" in callback && callback.pending) {
          data = callback.pending({}, state[name].data, requestParams);
        }
        commit(actionName + "_pending", data);
      } else {
        return;
      }
    });
  };
};
