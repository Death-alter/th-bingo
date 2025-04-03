import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";
import { local } from "@/utils/Storage";
import { useRoomStore } from "./RoomStore";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

export const useLocalStore = defineStore("local", () => {
  const roomStore = useRoomStore();
  const router = useRouter();

  //用户数据
  const online = ref(false);
  watch(online, (flag) => {
    nextTick(() => {
      if (flag) {
        if (!roomStore.roomId) {
          router.push("/");
        }
      } else {
        router.push("/login");
      }
    });
  });

  const username = ref("");
  const password = ref("");
  const savedUserData = local.get("userData");
  if (savedUserData) {
    username.value = savedUserData.username;
    password.value = savedUserData.password;
  }

  const userData = computed(() => ({
    username: username.value,
    password: password.value,
  }));

  const login = () => {
    if (username.value && password.value) {
      return ws
        .send(WebSocketActionType.LOGIN, {
          name: username.value,
          pwd: password.value,
        })
        .then((res: any) => {
          local.set("userData", userData.value);
          res && res.rid && (roomStore.roomId = res.rid);
          online.value = true;
        })
        .catch((e) => {});
    }
  };
  login();

  const logout = () => {
    if (roomStore.inRoom) {
      return ws.send(WebSocketActionType.LEAVE_ROOM).then(() => {
        roomStore.roomId = "";
        username.value = "";
        password.value = "";
        local.remove("userData");
        online.value = false;
        ws.reconnect();
      });
    } else {
      return new Promise((reslove, reject) => {
        username.value = "";
        password.value = "";
        local.remove("userData");
        online.value = false;
        ws.reconnect();
        reslove(null);
      });
    }
  };
  ws.on<{ now: number }>(WebSocketPushActionType.PUSH_KICK, () => {
    logout();
    ElMessage.error("该账号在别处登录");
  });

  //时间
  const localTime = ref(new Date().getTime());
  const serverTime = ref(0);
  const ping = ref(0);
  watch(localTime, (time) => {
    ping.value = time - ws.heartBeatSendTime;
  });
  const timeMistake = computed(() => serverTime.value - localTime.value);
  ws.on<{ now: number }>(WebSocketActionType.HEART, (data) => {
    serverTime.value = data!.now;
    localTime.value = new Date().getTime();
  });

  return {
    username,
    password,
    userData,
    localTime,
    serverTime,
    ping,
    timeMistake,
    online,
    login,
    logout,
  };
});
