<template>
  <div class="room">
    <el-row>
      <el-col :span="4"></el-col>
      <el-col :span="16">
        <div class="room-title">{{ title }}</div>
        <div class="game">
          <standard v-if="gameRule === 'standard'" />
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

export default defineComponent({
  name: "Room",
  data: () => {
    return {
      gameRule: "standard",
      title: "A VS B",
    };
  },
  components: {
    standard,
    ElRow,
    ElCol,
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
}
</style>
