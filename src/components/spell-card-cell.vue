<template>
  <div class="spell-card-cell">
    <div class="spell-card-info">
      <div class="level">
        <div
          class="level-icons"
          :class="{
            level1: level === 1,
            level2: level === 2,
            level3: level === 3,
          }"
        >
          <el-icon v-for="(item, index) in new Array(level)" :key="index"
            ><StarFilled
          /></el-icon>
        </div>
      </div>
      <div class="name">{{ name }}</div>
      <div class="game-name"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElIcon } from "element-plus";

export default defineComponent({
  name: "SpellCardCell",
  data: () => {
    return {};
  },
  components: {
    ElIcon,
  },
  props: {
    level: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
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

<style lang="scss" scoped>
.spell-card-cell {
  width: 20%;
  height: 20%;
  position: relative;
  box-sizing: border-box;
  padding: 5px;

  .spell-card-info {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

    .level {
      position: absolute;
      top: 0;
      left: 0;

      .level1 {
        color: rgb(233, 220, 36);
      }

      .level2 {
        color: rgb(212, 124, 9);
      }

      .level3 {
        color: red;
      }
    }

    .name {
      text-align: center;
      word-break: break-all;
      font-size: 14px;
    }
  }
}
</style>
