<template>
  <div class="info-window">
    <div class="info">
      <el-tabs v-model="tabIndex" class="info-tabs" @tab-click="handleClick">
        <el-tab-pane label="用户/房间" :name="0" class="tab-content">
          <div>
            <div class="user-info">
              <el-form label-width="90px">
                <el-form-item label="用户名：">
                  <span>{{ userData.userName }}</span>
                </el-form-item>
              </el-form>
              <div class="logout">
                <el-button type="primary" @click="logout">退出登录</el-button>
              </div>
              <el-divider style="margin: 10px 0"></el-divider>
            </div>
            <div class="room-info" v-if="roomData_status === 'success'">
              <el-form label-width="90px">
                <el-form-item label="房间密码：">******</el-form-item>
                <el-form-item label="规则：">标准赛</el-form-item>
                <el-form-item label="创建者：">Death</el-form-item>
              </el-form>
            </div>
            <div class="room-info-none" v-if="roomData_status !== 'success'">
              目前尚未加入房间
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="房间设置" :name="1" class="tab-content">
        </el-tab-pane>
        <el-tab-pane label="操作记录" :name="2" class="tab-content">
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import {
  ElTabs,
  ElTabPane,
  ElDivider,
  ElForm,
  ElFormItem,
  ElButton,
} from "element-plus";
import Storage from "@/utils/Storage";

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
    ElForm,
    ElFormItem,
    ElButton,
  },
  computed: {},
  setup() {
    const store = useStore();
    return {
      userData: computed(() => store.getters.userData),
      roomData: computed(() => store.getters.roomData),
      roomData_status: computed(() => store.getters.roomData_status),
    };
  },
  methods: {
    handleClick() {},
    logout() {
      Storage.local.remove("userData");
      this.$store.commit("LOGOUT");
      this.$router.push("/login");
    },
  },
});
</script>

<style scoped lang="scss">
.info-window {
  width: 100%;
  height: 100%;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  .info {
    height: 100%;

    .info-tabs {
      height: 100%;

      :deep(.el-tabs__content) {
        height: calc(100% - 55px);
      }

      :deep(.el-tab-pane) {
        height: 100%;
      }
    }
  }
}

.user-info {
  text-align: left;
}
.room-info {
  text-align: left;
}

.room-info-none {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-flex-box {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout {
  width: 100%;
  text-align: center;
  height: 40px;
  margin-top: 20px;
}
</style>
