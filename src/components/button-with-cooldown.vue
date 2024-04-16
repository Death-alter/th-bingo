<template>
  <el-button type="primary" :disabled="disabled || locked">{{ label }}</el-button>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed } from "vue";
import { useStore } from "vuex";
import { ElButton } from "element-plus";
import GameTime from "@/utils/GameTime";

export default defineComponent({
  name: "ButtonWithCooldown",
  components: {
    ElButton,
  },
  props: {
    disabled: {
      type: Boolean,
    },
    cooldown: {
      type: Number,
      default: 0,
    },
    text: {
      type: String,
      default: "",
    },
    startTime: {
      type: Number,
      default: 0,
    },
    immediate: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, context) {
    const store = useStore();

    const label = ref("");
    const locked = ref(false);
    const timer = ref(0);
    const gamePaused = computed(() => store.getters.gamePaused);

    const getSecond = () => {
      let second;
      if (props.startTime === 0) {
        return 0;
      } else {
        const time = GameTime.passed - props.startTime;
        second = props.cooldown - Math.floor(time / 1000);
        if (second < 0) second = 0;
      }
      return second;
    };

    const cooling = () => {
      if (props.cooldown > 0) {
        const second = getSecond();
        if (second > 0) {
          locked.value = true;
          label.value = `${second}秒后可` + props.text;
          if (timer.value) window.clearInterval(timer.value);
          timer.value = window.setInterval(() => {
            const second = getSecond();
            if (second <= 0) {
              label.value = props.text;
              window.clearInterval(timer.value);
              timer.value = 0;
              locked.value = false;
            } else {
              label.value = `${second}秒后可` + props.text;
            }
          }, 1000);
        }
      }
    };

    onMounted(() => {
      label.value = props.text;
      if (props.immediate) {
        cooling();
      }
    });
    onUnmounted(() => {
      locked.value = false;
    });

    return {
      label,
      locked,
      timer,
      gamePaused,
      getSecond,
      cooling,
    };
  },
});
</script>
