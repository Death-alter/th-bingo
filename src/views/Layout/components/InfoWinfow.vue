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
              <div class="info-button">
                <el-button type="primary" @click="logout">退出登录</el-button>
              </div>
              <el-divider style="margin: 10px 0"></el-divider>
            </div>
            <div class="room-info" v-if="roomData.rid">
              <el-form label-width="90px">
                <el-form-item label="房间密码：">
                  <div class="room-passward">
                    <span>******</span>
                    <el-button link type="primary" @click="copyPassword">复制</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="规则：">{{ getRoomTypeText(roomData.type) }}</el-form-item>
                <el-form-item label="创建者：">{{ roomData.host }}</el-form-item>
              </el-form>
              <div class="info-button">
                <el-button type="primary" @click="leaveRoom">退出房间</el-button>
              </div>
            </div>
            <div class="room-info-none" v-if="!roomData.rid">目前尚未加入房间</div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="房间设置" :name="1" class="tab-content"> </el-tab-pane>
        <el-tab-pane label="操作记录" :name="2" class="tab-content"> </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import { ElTabs, ElTabPane, ElDivider, ElForm, ElFormItem, ElButton, ElMessage } from "element-plus";
import ws from "@/utils/webSocket";
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
    };
  },
  methods: {
    handleClick() {},
    logout() {
      this.$store.commit("remove_user_data");
      this.$store.dispatch("leave_room").then(() => {
        ws.closeConnection();
        this.$router.push("/login");
      });
    },
    getRoomTypeText(type: number) {
      switch (type) {
        case 1:
          return "bingo标准赛";
        case 2:
          return "bingo BP赛";
        case 3:
          return "";
        default:
          return "未选择比赛类型";
      }
    },
    leaveRoom() {
      this.$store.dispatch("leave_room").then(() => {
        this.$router.push("/");
      });
    },
    copyPassword() {
      navigator.clipboard
        .writeText(this.roomData.rid)
        .then(() => {
          ElMessage({
            message: "已复制密码到剪切板",
            type: "success",
          });
        })
        .catch(() => {
          ElMessage({
            message: "复制失败",
            type: "error",
          });
        });
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

.info-button {
  width: 100%;
  text-align: center;
  height: 40px;
  margin-top: 20px;
}

.room-passward {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
</style>
