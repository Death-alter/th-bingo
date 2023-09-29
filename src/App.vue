<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Storage from "./utils/Storage";

export default defineComponent({
  created() {
    this.$store.commit("get_user_data");
    const savedSettings = Storage.local.get("roomSettings");
    if (savedSettings) {
      savedSettings.gameTimeLimit = savedSettings.gameTimeLimit[1];
      savedSettings.countDownTime = savedSettings.countDownTime[1];
      this.$store.commit("modify_room_settings", savedSettings);
    }
  },
});
</script>

<style lang="scss">
@import "@/assets/scss/variable.scss";
@import "@/assets/scss/animation.scss";

* {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100vw;
  height: 100vh;
}

#app::after {
  content: "";
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

@media (max-width: $minWidth) {
  #app {
    width: $minWidth;
  }
  #app::after {
    width: $minWidth;
  }
}

@media (max-height: $minHeight) {
  #app {
    height: $minHeight;
  }
  #app::after {
    height: $minHeight;
  }
}

.relative-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
