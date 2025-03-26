import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType } from "@/utils/webSocket/types";
import { local } from "@/utils/Storage";
import { useRoomStore } from "./RoomStore";

export const useLocalStore = defineStore("local", () => {
  const roomStore = useRoomStore();

  //用户数据
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
        return res;
      });
  };

  const logout = () => {
    if (roomStore.inRoom) {
      return ws.send(WebSocketActionType.LEAVE_ROOM).then(() => {
        local.remove("userData");
        ws.reconnect();
      });
    } else {
      return new Promise((reslove, reject) => {
        local.remove("userData");
        ws.reconnect();
        reslove(null);
      });
    }
  };

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
