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
import InfoWindow from "@/components/InfoWinfow.vue";

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
.layout {
  width: 100%;
  height: 100%;

  .layout-inner {
    width: 1280px;
    display: flex;
    justify-content: space-between;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    .layout-main-window {
      width: 900px;
      height: 500px;
      box-shadow: #00000044 0 0 5px 5px;
      border-radius: 5px;
      padding: 10px 15px;
    }

    .layout-info-window {
      width: 300px;
      height: 500px;
      box-shadow: #00000044 0 0 5px 5px;
      border-radius: 5px;
      padding: 10px 15px;
    }
  }
}
</style>
