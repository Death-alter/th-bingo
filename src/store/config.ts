import { createGetter, createAsyncMutations, createSyncMutation, createAction } from "./utils";
import storeItems from "./storeItems";
import { StoreAction, StoreMutation, MutationHandler, ActionHandler } from "@/types";

const config = {
  state: {},
  getters: {},
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
    config.mutations[item.mutationName] = createSyncMutation(item.name, <MutationHandler>item.dataHandler);
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

console.log(config)

export default config;
