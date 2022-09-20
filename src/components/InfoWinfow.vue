<template>
  <div class="info-window">
    <div class="info">
      <el-tabs v-model="tabIndex" class="demo-tabs" @tab-click="handleClick">
        <el-tab-pane label="用户信息" :name="0">User</el-tab-pane>
        <el-tab-pane label="房间信息" :name="1">Config</el-tab-pane>
      </el-tabs>
    </div>
    <el-divider></el-divider>
    <div class="logs"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElTabs, ElTabPane, ElDivider } from "element-plus";

export default defineComponent({
  name: "InfoWinfow",
  data() {
    return {
      tabIndex: 0,
    };
  },
  components: {
    ElTabs,
    ElTabPane,
    ElDivider,
  },
  methods: {
    handleClick() {},
  },
});
</script>

<style scoped lang="scss"></style>
