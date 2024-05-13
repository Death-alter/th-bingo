import { createGetter, createAsyncMutations, createSyncMutation, createAction } from "./utils";
import storeItems from "./storeItems";
import { MutationHandler, ActionHandler, VuexState, Role, BpStatus } from "@/types";

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
    isPlayer: (state: VuexState) => state.roomData.data?.names?.includes(state.userData.data?.userName),
    isWatcher: (state: VuexState) => state.roomData.data?.watchers?.includes(state.userData.data?.userName),
    userRole: (state: VuexState) => {
      const userName = state.userData.data?.userName;
      if (!userName) return null;
      if (state.roomData.data?.host && state.roomData.data?.host === userName) {
        return Role.HOST;
      }
      if (state.roomData.data?.names?.includes(userName)) {
        return Role.PLAYER;
      }
      if (state.roomData.data?.watchers?.includes(userName)) {
        return Role.WATHCER;
      }
    },
    soloMode: (state: VuexState) => !state.roomData.data?.host,
    trainingMode: (state: VuexState) => !state.roomData.data?.host && state.roomData.data?.names[1] === "训练用毛玉",
    playerASelectedIndex: (state: VuexState) =>
      (() => {
        if (state.gameData.data?.status) {
          const index = state.gameData.data?.status.indexOf(1);
          if (index !== -1) {
            return index;
          } else {
            return state.gameData.data?.status.indexOf(2);
          }
        }
      })(),
    playerBSelectedIndex: (state: VuexState) =>
      (() => {
        if (state.gameData.data?.status) {
          const index = state.gameData.data?.status.indexOf(3);
          if (index !== -1) {
            return index;
          } else {
            return state.gameData.data?.status.indexOf(2);
          }
        }
      })(),
    inGame: (state: VuexState) => !!state.roomData.data?.started,
    inMatch: (state: VuexState) => {
      const score = state.roomData.data?.score;
      if (!score) return false;
      const totalScore = score[0] + score[1];
      if (totalScore > 0 || state.banPickInfo.data?.phase > 0 || !!state.roomData.data?.started) {
        return true;
      } else {
        return false;
      }
    },
    gamePaused: (state: VuexState) => !!state.gameData.data?.pause_begin_ms,
    bpStatus: (state: VuexState) => {
      if (!state.banPickInfo.data || !state.banPickInfo.data.phase) return null;
      switch (state.banPickInfo.data.phase) {
        case 1:
        case 3:
          return BpStatus.IS_A_PICK;
        case 2:
        case 4:
          return BpStatus.IS_B_PICK;
        case 5:
        case 8:
        case 9:
          return BpStatus.IS_A_BAN;
        case 6:
        case 7:
        case 10:
          return BpStatus.IS_B_BAN;
        case 11:
          return BpStatus.SELECT_OPEN_EX;
        case 9999:
          return BpStatus.BP_FINISH;
      }
    },
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

export default config;
