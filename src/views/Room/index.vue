<template>
  <div class="room">
    <el-row>
      <el-col :span="4"></el-col>
      <el-col :span="16">
        <div class="room-title">{{ title }}</div>
        <div class="game">
          <standard v-if="gameRule === 'standard'" />
        </div>
        <div class="count-down-wrap">
          <count-down :seconds="300" v-model:paused="paused"></count-down>
        </div>
      </el-col>
      <el-col :span="4"></el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElRow, ElCol } from "element-plus";
import standard from "./games/standard.vue";
import CountDown from "@/components/count-down.vue";

export default defineComponent({
  name: "Room",
  data() {
    return {
      gameRule: "standard",
      title: "A VS B",
      paused: true,
      seconds: 10,
    };
  },
  components: {
    standard,
    ElRow,
    ElCol,
    CountDown,
  },
  methods: {},
});
</script>

<style lang="scss" scoped>
.room {
  .room-title {
    font-size: 28px;
    margin: 16px 0;
  }

  .count-down-wrap {
    font-size: 30px;
  }
}
</style>
