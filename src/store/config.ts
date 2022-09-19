import {
  createGetter,
  createAsyncMutations,
  createSyncMutation,
  createAction,
} from "./utils";
import storeItems from "./storeItems";

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

  if (item.mutationName) {
    if (!config.state[item.name]) {
      config.state[item.name] = item.default;
      config.getters[item.name] = createGetter(
        item.name,
        item.default,
        "mutation"
      );
    }
    config.mutations[item.mutationName] = createSyncMutation(
      item.name,
      item.dataHandler
    );
  }

  if (item.actionName) {
    config.state[item.name] = { data: item.default };
    config.getters[item.name] = createGetter(item.name, item.default, "action");
    config.getters[item.name + "_status"] = createGetter(
      item.name,
      "",
      "status"
    );
    config.mutations = {
      ...config.mutations,
      ...createAsyncMutations(item.name, item.actionName),
    };
    config.actions[item.actionName] = createAction(
      item.name,
      item.actionName,
      item.url,
      item.method || "get",
      item.dataHandler
    );
  }
}

export default config;
