import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { local } from "@/utils/Storage";
import { useRoomStore } from "@/store/RoomStore";

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
  const roomStore = useRoomStore();

  const userData = local.get("userData");
  if (to.path === "/login") {
    if (userData) {
      next("/");
      return;
    }
  } else {
    if (!userData) {
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
