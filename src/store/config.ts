import { createGetter, createAsyncMutations, createSyncMutation, createAction } from "./utils";
import storeItems from "./storeItems";
import { MutationHandler, ActionHandler, VuexState } from "@/types";

const config = {
  state: {},
  getters: {
    inRoom: (state: VuexState) => !!state.roomData.data?.rid,
    isHost: (state: VuexState) =>
      state.roomData.data?.host && state.roomData.data?.host === state.userData.data?.userName,
    isPlayerA: (state: VuexState) =>
      state.roomData.data?.names && state.roomData.data?.names[0] === state.userData.data?.userName,
    isPlayerB: (state: VuexState) =>
      state.roomData.data?.names && state.roomData.data?.names[1] === state.userData.data?.userName,
    plyaerASelectedIndex: (state: VuexState) => state.gameData.data?.status && state.gameData.data?.status.indexOf(1),
    plyaerBSelectedIndex: (state: VuexState) => state.gameData.data?.status && state.gameData.data?.status.indexOf(3),
    inGame: (state: VuexState) => !!state.roomData.data?.started,
  },
  mutations: {},
  actions: {},
};

for (const item of storeItems) {
  if (item.name) {
    if (!config.state[item.name]) {
      config.state[item.name] = null;
    }
  } else {
    continue;
  }

  if ("mutationName" in item) {
    if (!config.state[item.name]) {
      config.state[item.name] = { data: item.default };
      config.getters[item.name] = createGetter(item.name, item.default, "mutation");
    }
    config.mutations[item.mutationName] = createSyncMutation(item.name, item.wsName, <MutationHandler>item.dataHandler);
  }

  if ("actionName" in item) {
    config.state[item.name] = { data: item.default };
    config.getters[item.name] = createGetter(item.name, item.default, "action");
    config.getters[item.name + "_status"] = createGetter(item.name, "", "status");
    config.mutations = {
      ...config.mutations,
      ...createAsyncMutations(item.name, item.actionName),
    };
    config.actions[item.actionName] = createAction(
      item.name,
      item.actionName,
      item.wsName,
      item.noParams,
      <ActionHandler>item.dataHandler
    );
  }
}

console.log(config);

export default config;
