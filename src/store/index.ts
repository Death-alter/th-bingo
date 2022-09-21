import { createStore, Store } from "vuex";
import config from "./config";

const store: Store<any> = createStore(config);

export default store;
