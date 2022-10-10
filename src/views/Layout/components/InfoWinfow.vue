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
                <el-button type="primary" @click="logout" :disabled="inGame">退出登录</el-button>
              </div>
            </div>
            <el-divider style="margin: 10px 0;"></el-divider>
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
                    <div>
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
                <el-button type="primary" @click="leaveRoom" :disabled="inGame">退出房间</el-button>
              </div>
            </div>
            <div class="room-info-none" v-if="!inRoom">目前尚未加入房间</div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="房间设置" :name="1" class="tab-content">
          <template v-if="isHost">
            <div class="setting-title">房间设置</div>
            <el-form label-width="90px">
              <el-form-item label="比赛时长：">
                <el-input-number
                  class="input-number"
                  v-model="roomSettings.gameTimeLimit"
                  :min="40"
                  :max="180"
                  size="small"
                  controls-position="right"
                  @change="synchroRoomSettings"
                />
                <span class="input-number-text">分钟</span>
              </el-form-item>
              <el-form-item label="倒计时：">
                <el-input-number
                  class="input-number"
                  v-model="roomSettings.countDownTime"
                  :min="0"
                  size="small"
                  controls-position="right"
                  @change="synchroRoomSettings"
                />
                <span class="input-number-text">秒</span>
              </el-form-item>
              <el-form-item label="题目：">
                <el-checkbox-group
                  v-model="roomSettings.checkList"
                  style="text-align: left;"
                  @change="synchroRoomSettings"
                >
                  <el-checkbox v-for="(item, index) in gameList" :label="item.code" :key="index">{{
                    item.name
                  }}</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
            <el-divider style="margin: 10px 0;"></el-divider>
          </template>
          <div class="setting-title">左侧玩家设置</div>
          <el-form label-width="90px">
            <el-form-item label="颜色：">
              <el-color-picker
                v-model="roomSettings.playerA.color"
                size="small"
                color-format="hsl"
                show-alpha
                :predefine="predefineColors"
                @change="synchroRoomSettings"
              />
            </el-form-item>
            <el-form-item label="延迟时间：">
              <el-input-number
                class="input-number"
                v-model="roomSettings.playerA.delay"
                :min="0"
                size="small"
                controls-position="right"
                @change="synchroRoomSettings"
              />
              <span class="input-number-text">秒</span>
            </el-form-item>
          </el-form>
          <el-divider style="margin: 10px 0;"></el-divider>
          <div class="setting-title">右侧玩家设置</div>
          <el-form label-width="90px">
            <el-form-item label="颜色：">
              <el-color-picker
                v-model="roomSettings.playerB.color"
                size="small"
                color-format="hsl"
                show-alpha
                :predefine="predefineColors"
                @change="synchroRoomSettings"
              />
            </el-form-item>
            <el-form-item label="延迟时间：">
              <el-input-number
                class="input-number"
                v-model="roomSettings.playerB.delay"
                :min="0"
                size="small"
                controls-position="right"
                @change="synchroRoomSettings"
              />
              <span class="input-number-text">秒</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
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
  ElOption,
  ElCheckboxGroup,
  ElCheckbox,
  ElInputNumber,
  ElColorPicker,
} from "element-plus";
import ws from "@/utils/webSocket";
import config from "@/config";

export default defineComponent({
  name: "InfoWinfow",
  data() {
    return {
      tabIndex: 0,
      showNameInput: false,
      showTypeInput: false,
      userName: "",
      roomType: 1,
      gameList: config.gameOptionList,
      predefineColors: config.predefineColors,
      roomSettings: {
        gameTimeLimit: 60,
        countDownTime: 300,
        checkList: ["6", "7", "8", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
        playerA: {
          color: "#ff4500",
          delay: 5,
        },
        playerB: {
          color: "#1e90ff",
          delay: 5,
        },
      },
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
    ElOption,
    ElCheckboxGroup,
    ElCheckbox,
    ElInputNumber,
    ElColorPicker,
  },
  computed: {},
  setup() {
    const store = useStore();
    return {
      userData: computed(() => store.getters.userData),
      roomData: computed(() => store.getters.roomData),
      inRoom: computed(() => store.getters.inRoom),
      isHost: computed(() => store.getters.isHost),
      inGame: computed(() => store.getters.inGame),
    };
  },
  mounted() {
    this.userName = this.userData && this.userData.userName;
    this.roomType = this.roomData && this.roomData.type;
    this.$store.commit("modify_room_settings", this.roomSettings);
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
    },
    synchroRoomSettings() {
      this.$store.commit("modify_room_settings", this.roomSettings);
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

.setting-title {
  text-align: left;
  margin-bottom: 5px;
  font-size: 16px;
  font-weight: 600;
}

.input-number {
  width: 96px;
}

.input-number-text {
  margin-left: 5px;
}
</style>
