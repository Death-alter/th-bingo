import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import store from "../store";
import ws, { WS } from "@/utils/webSocket";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Layout",
    component: () => import("@/views/Layout/index.vue"),
    children: [
      {
        path: "/",
        name: "Home",
        component: () => import("@/views/Home/index.vue"),
      },
      {
        path: "/room",
        name: "Room",
        component: () => import("@/views/Room/index.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login/index.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const userData = store.getters.userData;
  if (to.path === "/login") {
    if (userData.token) {
      next("/");
      return;
    }
  } else {
    if (!userData.token) {
      next("/login");
      return;
    } else if (ws.state !== 1) {
      ws.setHeartBeatFunction(() => {
        store.dispatch("heart_beat", { time: new Date().getTime() });
        setTimeout(() => {
          console.log(store.getters.heartBeat_status);
          console.log("bufferedAmount:", ws.bufferedAmount);
          if (store.getters.heartBeat_status === "pending") {
            ws.reconnect();
          }
        }, WS.timeOutSeconds * 1000);
      });
      ws.createConnection().then(() => {
        store.dispatch("login", { token: userData.token });
      });
      ws.on("reconnect", () => {
        store.dispatch("login", { token: userData.token });
      });
    }
  }

  if (to.path === "/room") {
    if (!store.getters.roomData.rid) {
      next("/");
      return;
    }
  } else {
    if (store.getters.roomData.rid) {
      next("/room");
      return;
    }
  }

  next();
});

export default router;
