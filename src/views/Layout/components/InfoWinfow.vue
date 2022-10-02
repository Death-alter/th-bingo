<template>
  <div class="info-window">
    <div class="info">
      <el-tabs v-model="tabIndex" class="info-tabs" @tab-click="handleClick">
        <el-tab-pane label="用户/房间" :name="0" class="tab-content">
          <div>
            <div class="user-info">
              <el-form label-width="90px">
                <el-form-item label="用户名：">
                  <div class="label-with-button">
                    <div class="userName">
                      <el-input v-if="showNameInput" v-model="userName"></el-input>
                      <span v-else>{{ userData.userName }}</span>
                    </div>
                    <el-button link type="primary" @click="editName">{{ showNameInput ? "确认" : "修改" }}</el-button>
                  </div>
                </el-form-item>
              </el-form>
              <div class="info-button">
                <el-button type="primary" @click="logout">退出登录</el-button>
              </div>
              <el-divider style="margin: 10px 0"></el-divider>
            </div>
            <div class="room-info" v-if="inRoom">
              <el-form label-width="90px">
                <el-form-item label="房间密码：">
                  <div class="label-with-button">
                    <span>******</span>
                    <el-button link type="primary" @click="copyPassword">复制</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="规则：">
                  <div class="label-with-button">
                    <div class="userName">
                      <el-select v-if="showTypeInput" v-model="roomType">
                        <el-option label="bingo 标准赛" :value="1"></el-option>
                        <el-option label="bingo BP赛" :value="2"></el-option>
                        <el-option label="bingo 自定义" :value="3"></el-option>
                      </el-select>
                      <span v-else> {{ getRoomTypeText(roomData.type) }}</span>
                    </div>
                    <el-button link type="primary" @click="editType">{{ showTypeInput ? "确认" : "修改" }}</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="创建者：">{{ roomData.host }}</el-form-item>
              </el-form>
              <div class="info-button">
                <el-button type="primary" @click="leaveRoom">退出房间</el-button>
              </div>
            </div>
            <div class="room-info-none" v-if="!inRoom">目前尚未加入房间</div>
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
import {
  ElTabs,
  ElTabPane,
  ElDivider,
  ElForm,
  ElFormItem,
  ElButton,
  ElMessage,
  ElInput,
  ElSelect,
  ElOption
} from "element-plus";
import ws from "@/utils/webSocket";
export default defineComponent({
  name: "InfoWinfow",
  data() {
    return {
      tabIndex: 0,
      showNameInput: false,
      showTypeInput: false,
      userName: "",
      roomType: 1
    };
  },
  components: {
    ElTabs,
    ElTabPane,
    ElDivider,
    ElForm,
    ElFormItem,
    ElButton,
    ElInput,
    ElSelect,
    ElOption
  },
  computed: {},
  setup() {
    const store = useStore();
    return {
      userData: computed(() => store.getters.userData),
      roomData: computed(() => store.getters.roomData),
      inRoom: computed(() => !!store.getters.roomData.rid)
    };
  },
  mounted() {
    this.userName = this.userData && this.userData.userName;
    this.roomType = this.roomData && this.roomData.type;
  },
  watch: {
    userData(val) {
      this.userName = val.userName;
    },
    roomData(val) {
      this.roomType = val.type;
    },
  },
  methods: {
    handleClick() {},
    logout() {
      this.$store.commit("remove_user_data");
      if (this.inRoom) {
        this.$store.dispatch("leave_room").then(() => {
          ws.closeConnection();
          this.$router.push("/login");
        });
      } else {
        ws.closeConnection();
        this.$router.push("/login");
      }
    },
    getRoomTypeText(type: number) {
      switch (type) {
        case 1:
          return "bingo 标准赛";
        case 2:
          return "bingo BP赛";
        case 3:
          return "bingo 自定义";
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
            type: "success"
          });
        })
        .catch(() => {
          ElMessage({
            message: "复制失败",
            type: "error"
          });
        });
    },
    editName() {
      if (this.showNameInput === false) {
        this.showNameInput = true;
      } else {
        if (this.userName !== this.userData.userName) {
          const data = { ...this.userData };
          data.userName = this.userName;
          if (this.inRoom) {
            this.$store.dispatch("update_name", { name: this.userName }).then(() => {
              this.$store.commit("set_user_data", data);
            });
          } else {
            this.$store.commit("set_user_data", data);
          }
        }
        this.showNameInput = false;
      }
    },
    editType() {
      if (this.showTypeInput === false) {
        this.showTypeInput = true;
      } else {
        if (this.roomType !== this.roomData.type) {
          this.$store.dispatch("update_room_type", { type: this.roomType }).then(() => {
            this.showTypeInput = false;
          });
        } else {
          this.showTypeInput = false;
        }
      }
    }
  }
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

.label-with-button {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.userName {
  width: 70%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
