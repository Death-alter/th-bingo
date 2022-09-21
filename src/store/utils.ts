import request from "@/utils/request";
import {
  VuexState,
  StoreData,
  ActionHandler,
  MutationHandler,
  RequestParams,
} from "@/types";
import { Store } from "vuex";

export const createGetter = (name: string, defaultValue: any, type: string) => {
  if (type === "status") {
    return (state: VuexState) => state[name].status || defaultValue;
  } else {
    return (state: VuexState) => state[name].data || defaultValue;
  }
};

export const createAsyncMutations = (name: string, actionName: string) => {
  const obj = {};
  obj[actionName + "_PENDING"] = (state: VuexState) => {
    if (!state[name]) {
      state[name] = {
        status: "pending",
        data: null,
      };
    } else {
      state[name].status = "pending";
    }
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_PENDING");
    }
  };
  obj[actionName + "_SUCCESS"] = (state: VuexState, data: any) => {
    const newVal: StoreData = {
      status: "success",
    };
    if (data) {
      newVal.data = data;
    }
    state[name] = newVal;
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_SUCCESS");
    }
  };
  obj[actionName + "_FAILURE"] = (state: VuexState, error: string) => {
    const newVal: StoreData = {
      status: "failure",
    };
    if (error) {
      newVal.error = error;
    }
    state[name] = newVal;
    if (process.env.NODE_ENV === "development") {
      console.log(actionName + "_FAILURE");
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

export const createAction =
  (
    name: string,
    actionName: string,
    url: string,
    method: string,
    callback: ActionHandler
  ) =>
  ({ commit, state }: Store<any>, data: RequestParams) =>
    new Promise((resolve, reject) => {
      if (state[name].status !== "pending") {
        commit(actionName + "_PENDING");
        if (method.toLowerCase() === "socket") {
        } else if (!method || method.toLowerCase() === "get") {
          request({ url, params: data, method })
            .then((res) => {
              const storeData: StoreData | null = callback
                ? callback(res, state[name].data, data)
                : null;
              commit(actionName + "_SUCCESS", storeData);
              resolve(storeData);
            })
            .catch((err) => {
              commit(actionName + "_FAILURE", err);
              reject(err);
            });
        } else {
          request({ url, data, method })
            .then((res) => {
              const storeData: StoreData | null = callback
                ? callback(res, state[name].data, data)
                : null;
              commit(actionName + "_SUCCESS", res);
              resolve(storeData);
            })
            .catch((err) => {
              commit(actionName + "_FAILURE", err);
              reject(err);
            });
        }
      }
    });
