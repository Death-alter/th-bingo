<template>
  <el-button type="primary" :disabled="disabled || locked">{{ text }}</el-button>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import { ElButton } from "element-plus";

export default defineComponent({
  name: "ConfirmSelectButton",
  data() {
    return {
      timer: 0,
      text: "确认收取",
      locked: false,
    };
  },
  components: {
    ElButton,
  },
  setup() {
    const store = useStore();

    return {
      roomSettings: computed(() => store.getters.roomSettings),
    };
  },
  props: {
    disabled: {
      type: Boolean,
    },
  },
  mounted() {
    let second = this.roomSettings.confirmDelay || 0;
    if (second) {
      this.locked = true;
      this.text = `${second}秒后可确认收取`;
      this.timer = window.setInterval(() => {
        --second;
        if (second <= 0) {
          this.text = "确认收取";
          window.clearInterval(this.timer);
          this.timer = 0;
          this.locked = false;
        } else {
          this.text = `${second}秒后可确认收取`;
        }
      }, 1000);
    }
  },
  unmounted() {
    this.locked = false;
  },
});
</script>
