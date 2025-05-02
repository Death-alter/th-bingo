import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { useRoomStore } from "@/store/RoomStore";
import { useLocalStore } from "@/store/LocalStore";

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
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const roomStore = useRoomStore();
  const localStore = useLocalStore();

  if (to.path === "/login") {
    if (localStore.online) {
      next("/");
      return;
    }
  } else {
    if (!localStore.online) {
      next("/login");
      return;
    }
  }

  if (to.path.startsWith("/room") && !roomStore.roomId && to.params.rid) {
    next("/");
    return;
  }

  next();
});

export default router;
