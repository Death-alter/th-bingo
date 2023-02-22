<template>
  <audio ref="audio" :src="src" :muted="muted" :volume="volume"></audio>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "CountDown",
  data() {
    return {
      timer: 0,
    };
  },
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
      defalut: false,
    },
    muted: {
      type: Boolean,
      defalut: false,
    },
    volume: {
      type: Number, //0.0 - 1.0
      defalut: false,
    },
  },
  setup() {
    const audio = ref<HTMLAudioElement>();

    return {
      audio,
    };
  },
  computed: {
    duration() {
      const audio = this.audio as HTMLAudioElement;
      if (this.startTime && this.endTime) {
        return this.endTime - this.startTime;
      } else if (this.startTime) {
        return audio.duration - this.startTime;
      } else if (this.endTime) {
        return this.endTime;
      } else {
        return 0;
      }
    },
    paused() {
      const audio = this.audio as HTMLAudioElement;
      return audio.paused;
    },
  },
  methods: {
    play() {
      const audio = this.audio as HTMLAudioElement;
      audio.play();
      let delay = this.duration || audio.duration;
      if (audio.currentTime) {
        delay -= audio.currentTime;
      }
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        if (!this.loop) {
          this.stop();
        } else {
          audio.currentTime = this.startTime || 0;
          this.play();
        }
      }, delay * 1000);
    },
    pause() {
      this.audio?.pause();
      window.clearTimeout(this.timer);
    },
    stop() {
      this.pause();
      if (this.audio) this.audio.currentTime = this.startTime || 0;
    },
    setCurrent(time: number) {
      const audio = this.audio as HTMLAudioElement;
      const delay = this.duration || audio.duration;
      if (time > delay) time %= delay;
      if (this.audio) this.audio.currentTime = time;
    },
  },
});
</script>

<style lang="scss" scoped></style>
