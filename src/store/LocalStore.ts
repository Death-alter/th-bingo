import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType } from "@/utils/webSocket/types";
import { local } from "@/utils/Storage";
import { useRoomStore } from "./RoomStore";
import { useRouter } from "vue-router";

export const useLocalStore = defineStore("local", () => {
  const roomStore = useRoomStore();
  const router = useRouter();

  //用户数据
  const online = ref(false);
  const username = ref("");
  const password = ref("");
  const userData = computed(() => ({
    username: username.value,
    password: password.value,
  }));

  const login = () => {
    return ws
      .send(WebSocketActionType.LOGIN, {
        name: username.value,
        pwd: password.value,
      })
      .then((res: any) => {
        if (!local.has("userData")) {
          local.set("userData", userData.value);
        }
        res && res.rid && (roomStore.roomId = res.rid);
        online.value = true;
        return res;
      });
  };

  const logout = () => {
    if (roomStore.inRoom) {
      return ws.send(WebSocketActionType.LEAVE_ROOM).then(() => {
        local.remove("userData");
        ws.reconnect();
        online.value = false;
      });
    } else {
      return new Promise((reslove, reject) => {
        local.remove("userData");
        ws.reconnect();
        online.value = false;
        reslove(null);
      });
    }
  };

  watch(online, (flag) => {
    nextTick(() => {
      if (flag) {
        if (roomStore.roomId) {
          router.push(`/room/${roomStore.roomId}`);
        } else {
          router.push("/");
        }
      } else {
        router.push("/login");
      }
    });
  });

  const savedUserData = local.get("userData");
  if (savedUserData) {
    username.value = savedUserData.username;
    password.value = savedUserData.password;
    login();
  }

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
    login,
    logout,
  };
});
