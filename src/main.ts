import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import Mit from "@/mitt";
import VueKonva from "vue-konva";

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.config.globalProperties.$bus = Mit;
app.use(store).use(router).use(VueKonva, { prefix: "Konva" });
app.mount("#app");

export default app;
