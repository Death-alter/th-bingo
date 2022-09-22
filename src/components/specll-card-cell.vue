<template>
  <div class="spell-card-cell">
    <div class="level"></div>
    <div class="name"></div>
    <div class="game-name"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SpellCardCell",
  data: () => {
    return {};
  },
  props: {
    level: {
      type: Number,
      required: true,
    },
    selectMode: {
      type: String,
      default: "",
    },
    colors: {
      type: Array,
      default: () => ["red", "black"],
    },
    index: {
      type: Number,
    },
  },
  methods: {},
});
</script>

<style lang="scss" scoped></style>
