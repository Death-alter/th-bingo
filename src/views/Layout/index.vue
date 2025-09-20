<template>
  <div
    class="layout"
    :style="{
      '--A-color': roomSettings.playerA && roomSettings.playerA.color,
      '--B-color': roomSettings.playerB && roomSettings.playerB.color,
      '--A-color-dark': roomSettings.playerA && getDarkColor(roomSettings.playerA.color),
      '--B-color-dark': roomSettings.playerB && getDarkColor(roomSettings.playerB.color),
      '--bg-color': roomSettings.backgroundColor,
      '--bg-color-reverse': roomSettings.backgroundColorReverse,
    }"
  >
    <div class="layout-inner">
      <div class="layout-main-window">
        <router-view />
      </div>
      <div class="layout-info-window">
        <info-window></info-window>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import InfoWindow from "./components/InfoWinfow.vue";
import { useRoomStore } from "@/store/RoomStore";

const roomStore = useRoomStore();
const roomSettings = computed(() => roomStore.roomSettings);

const getDarkColor = (color: string) => {
  if (!color) {
    return "";
  }
  const arr = color.match(/\((.*),(.*)%,(.*)%(,(.*))?\)/);
  if (arr === null) {
    return "";
  }
  if (arr[5]) {
    return `hsla(${arr[1]},${arr[2]}%,${parseInt(arr[3]) - 20}%,${arr[5]})`;
  } else {
    return `hsl(${arr[1]},${arr[2]}%,${parseInt(arr[3]) - 20}%)`;
  }
};
</script>

<style lang="scss" scoped>
@import "@/assets/scss/variable.scss";

.layout {
  width: 100%;
  height: 100%;
  position: relative;

  .layout-inner {
    width: $minWidth;
    display: flex;
    justify-content: space-between;

    .layout-main-window {
      width: 960px;
      height: $minHeight;
      box-shadow: #00000044 0 0 5px 5px;
      border-radius: 5px;
      padding: 10px;
      box-sizing: border-box;
      position: relative;
      background-color: #ffffffdd;
    }

    .layout-info-window {
      width: 320px;
      height: $minHeight;
      box-shadow: #00000044 0 0 5px 5px;
      border-radius: 5px;
      padding: 10px 15px;
      box-sizing: border-box;
      overflow: hidden;
      background-color: #ffffffdd;
    }
  }
}

@media (min-width: $minWidth) and (min-height: $minHeight) {
  .layout-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

@media (min-width: $minWidth) and (max-height: $minHeight) {
  .layout-inner {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (max-width: $minWidth) and (min-height: $minHeight) {
  .layout-inner {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
  }
}

@media (max-width: $minWidth) and (max-height: $minHeight) {
  .layout-inner {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
