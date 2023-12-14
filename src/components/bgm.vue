<template>
  <audio ref="audioRef" :src="(src as string)" :muted="muted" :volume="volume"></audio>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

export default defineComponent({
  name: "CountDown",
  props: {
    startTime: {
      type: Number,
    },
    endTime: {
      type: Number,
    },
    src: {
      required: true,
    },
    loop: {
      type: Boolean,
      default: false,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    volume: {
      type: Number, //0.0 - 1.0
      default: 1.0,
    },
  },
  setup(props, context) {
    const audioRef = ref<HTMLAudioElement>();
    const timer = ref(0);
    const duration = computed(() => {
      if (!audioRef.value) return 0;
      if (props.startTime && props.endTime) {
        return props.endTime - props.startTime;
      } else if (props.startTime) {
        return audioRef.value.duration - props.startTime;
      } else if (props.endTime) {
        return props.endTime;
      } else {
        return 0;
      }
    });
    const paused = computed(() => {
      const audio = audioRef.value as HTMLAudioElement;
      return audio.paused;
    });

    const play = () => {
      if (!audioRef.value?.paused) return;
      audioRef.value.play();
      let delay = duration.value || audioRef.value.duration;
      if (audioRef.value.currentTime) {
        delay -= audioRef.value.currentTime;
      }
      if (timer.value) window.clearTimeout(timer.value);
      timer.value = window.setTimeout(() => {
        if (!props.loop) {
          stop();
        } else {
          audioRef.value!.currentTime = props.startTime || 0;
          play();
        }
      }, delay * 1000);
    };
    const pause = () => {
      audioRef.value?.pause();
      window.clearTimeout(timer.value);
    };
    const stop = () => {
      pause();
      if (audioRef.value) audioRef.value.currentTime = props.startTime || 0;
    };
    const setCurrent = (time: number) => {
      const delay = duration.value || audioRef.value?.duration || 0;
      if (time > delay) time %= delay;
      if (audioRef.value) audioRef.value.currentTime = time;
    };

    return {
      audioRef,
      timer,
      duration,
      paused,
      play,
      pause,
      stop,
      setCurrent,
    };
  },
});
</script>

<style lang="scss" scoped></style>
