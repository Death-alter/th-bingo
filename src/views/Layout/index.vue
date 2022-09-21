<template>
  <div class="layout">
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

<script lang="ts">
import { defineComponent } from "vue";
import InfoWindow from "./components/InfoWinfow.vue";

export default defineComponent({
  name: "Layout",
  data() {
    return {};
  },
  components: {
    InfoWindow,
  },
});
</script>

<style lang="scss" scoped>
@import "@/assets/variable.scss";

.layout {
  width: 100%;
  height: 100%;

  .layout-inner {
    width: $minWidth;
    display: flex;
    justify-content: space-between;

    .layout-main-window {
      width: 900px;
      height: $minHeight;
      box-shadow: #00000044 0 0 5px 5px;
      border-radius: 5px;
      padding: 10px 15px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    .layout-info-window {
      width: 300px;
      height: 500px;
      box-shadow: #00000044 0 0 5px 5px;
      border-radius: 5px;
      padding: 10px 15px;
      overflow: hidden;
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
