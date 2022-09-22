<template>
  <div class="room">
    <div class="room-title"></div>
    <div class="game">
      <standard v-if="gameRule === 'standard'" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import standard from "./games/standard.vue";

export default defineComponent({
  name: "Room",
  data: () => {
    return {
      gameRule: "standard",
    };
  },
  components: {
    standard,
  },
  methods: {},
});
</script>

<style lang="scss" scoped></style>
