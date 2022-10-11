<template>
  <div
    class="layout"
    :style="{
      '--A-color': roomSettings.playerA && roomSettings.playerA.color,
      '--B-color': roomSettings.playerB && roomSettings.playerB.color,
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
    <div class="layout-background"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import InfoWindow from "./components/InfoWinfow.vue";

export default defineComponent({
  name: "Layout",
  data() {
    return {};
  },
  components: {
    InfoWindow,
  },
  setup() {
    const store = useStore();
    return {
      roomSettings: computed(() => store.getters.roomSettings),
    };
  },
});
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
      padding: 10px 15px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
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

  .layout-background {
    position: absolute;
    z-index: -99;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: url("~@/assets/image/background.png") no-repeat center center;
    background-size: cover;
    opacity: 0.5;
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
