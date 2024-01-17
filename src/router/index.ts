import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import store from "../store";
import { ElMessage } from "element-plus";
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
        path: "/room/:rid",
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

router.beforeEach(async (to, from, next) => {
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
          if (store.getters.heartBeat_status === "pending") {
            ws.reconnect();
          }
        }, WS.timeOutSeconds * 1000);
      });
      ws.on("error_sc", (resName, data, trigger) => {
        ElMessage({
          message: data.msg,
          type: "error",
        });
        if (data.code < 0) {
          ws.closeConnection();
        }
      });
      await ws.createConnection();
      await store.dispatch("login", { token: userData.token });
      if (store.getters.roomData.rid) {
        if (!/^\/room/.test(to.path)) {
          next(`/room/${store.getters.roomData.rid}`);
          return;
        }
      } else {
        if (/^\/room/.test(to.path) && to.params.rid) {
          try {
            await store.dispatch("join_room", {
              name: store.getters.userData.userName,
              rid: to.params.rid,
            });
          } catch (e) {
            next("/");
            return;
          }
        }
      }
      ws.on("reconnect", () => {
        store.dispatch("login", { token: userData.token }).then(() => {
          if (store.getters.roomData.started) {
            store.dispatch("get_spells");
          }
        });
      });
    }
  }

  if (/^\/room/.test(to.path) && !to.params.rid) {
    next("/");
    return;
  }

  next();
});

export default router;
