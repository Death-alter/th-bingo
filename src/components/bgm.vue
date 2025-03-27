<template>
  <audio ref="audio" :src="(src as string)" :muted="muted" :volume="volume"></audio>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

const audio = ref<HTMLAudioElement>();
const timer = ref(0);
const duration = computed(() => {
  if (props.startTime && props.endTime) {
    return props.endTime - props.startTime;
  } else if (audio.value && props.startTime) {
    return audio.value.duration - props.startTime;
  } else if (props.endTime) {
    return props.endTime;
  } else {
    return 0;
  }
});
const paused = computed(() => audio.value?.paused);

const props = withDefaults(
  defineProps<{
    startTime?: number;
    endTime?: number;
    src: string;
    loop?: boolean;
    muted?: boolean;
    volume?: number;
  }>(),
  {
    src: "",
    loop: false,
    muted: false,
    volume: 1,
  }
);

const play = () => {
  if (!audio.value?.paused) return;
  audio.value?.play();
  let delay = duration.value || audio.value.duration;
  if (audio.value.currentTime) {
    delay -= audio.value.currentTime;
  }
  if (timer.value) window.clearTimeout(timer.value);
  timer.value = window.setTimeout(() => {
    if (!props.loop) {
      stop();
    } else {
      audio.value && (audio.value.currentTime = props.startTime || 0);
      play();
    }
  }, delay * 1000);
};

const pause = () => {
  audio.value?.pause();
  window.clearTimeout(timer.value);
};

const stop = () => {
  pause();
  audio.value && (audio.value.currentTime = props.startTime || 0);
};

const setCurrent = (time: number) => {
  const delay = duration.value || audio.value?.duration || 0;
  if (time > delay) time %= delay;
  audio.value && (audio.value.currentTime = time);
};

defineExpose({ duration, paused, setCurrent, play, stop });
</script>

<style lang="scss" scoped></style>
