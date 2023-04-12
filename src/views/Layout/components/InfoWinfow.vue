<template>
  <div class="info-window">
    <div class="info">
      <el-tabs v-model="tabIndex" class="info-tabs">
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
            <el-divider style="margin: 10px 0"></el-divider>
            <div class="room-info" v-if="inRoom">
              <el-form label-width="90px">
                <el-form-item label="房间密码：">
                  <div class="label-with-button">
                    <span>******</span>
                    <el-button link type="primary" @click="copyPassword">复制</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="房间规则：">
                  {{ getRoomTypeText(roomData.type) }}
                </el-form-item>
                <el-form-item label="房间模式：">{{ roomData.host ? "导播模式" : "无导播模式" }}</el-form-item>
                <el-form-item v-if="roomData.host" label="导播：">{{ roomData.host }}</el-form-item>
                <el-form-item label="左侧玩家：">{{ roomData.names[0] }}</el-form-item>
                <el-form-item label="右侧玩家：">{{ roomData.names[1] }}</el-form-item>
                <el-form-item label="观众：" v-if="roomData.watchers.length">
                  <div>
                    <div v-for="(item, index) in roomData.watchers" :key="index">{{ item }}</div>
                  </div>
                </el-form-item>
              </el-form>
              <div class="info-button">
                <template v-if="!isHost">
                  <el-button
                    v-if="isWatcher"
                    type="primary"
                    @click="sitDown"
                    :disabled="inGame || (roomData.names[0] !== '' && roomData.names[1] !== '')"
                    >成为玩家</el-button
                  >
                  <el-button v-if="isPlayer" type="primary" @click="standUp" :disabled="inGame">成为观众</el-button>
                </template>
                <el-button type="primary" @click="leaveRoom" :disabled="inGame && !isWatcher">退出房间</el-button>
              </div>
            </div>
            <div class="room-info-none" v-if="!inRoom">目前尚未加入房间</div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="房间设置" :name="1" class="tab-content">
          <el-scrollbar>
            <template v-if="(!soloMode && isHost) || (soloMode && isPlayerA)">
              <div class="setting-title">房间设置</div>
              <el-form label-width="90px">
                <el-form-item label="规则：">
                  <div class="label-with-button">
                    <div>
                      <el-select v-if="showTypeInput" v-model="roomType">
                        <el-option
                          v-for="(item, index) in gameTypeList"
                          :key="index"
                          :label="item.name"
                          :value="item.type"
                        ></el-option>
                      </el-select>
                      <span v-else> {{ getRoomTypeText(roomData.type) }}</span>
                    </div>
                    <el-button link type="primary" @click="editType" v-if="!inGame">{{
                      showTypeInput ? "确认" : "修改"
                    }}</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="比赛时长：" v-if="roomType !== 3">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.gameTimeLimit"
                    :min="10"
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
                <el-form-item label="赛制：">
                  <span style="margin-right: 5px">BO</span>
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.format"
                    :min="1"
                    :max="9"
                    :step="2"
                    size="small"
                    controls-position="right"
                    @change="onFormatChange"
                  />
                </el-form-item>
                <el-form-item label="题目：">
                  <el-checkbox-group
                    v-model="roomSettings.checkList"
                    style="text-align: left"
                    :min="1"
                    @change="synchroRoomSettings"
                  >
                    <el-checkbox v-for="(item, index) in gameList" :label="item.code" :key="index">{{
                      item.name
                    }}</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="符卡来源：">
                  <el-checkbox-group
                    v-model="roomSettings.rankList"
                    style="text-align: left"
                    :min="1"
                    @change="synchroRoomSettings"
                  >
                    <el-checkbox v-for="(item, index) in rankList" :label="item" :key="index">{{ item }}</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="bingo难度：">
                  <el-radio-group
                    v-model="roomSettings.difficulty"
                    style="text-align: left"
                    @change="synchroRoomSettings"
                  >
                    <el-radio v-for="(item, index) in difficultyList" :label="item.value" :key="index">{{
                      item.name
                    }}</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="自动收卡：">
                  <el-checkbox
                    v-model="roomSettings.enableTools"
                    @change="synchroRoomSettings"
                    style="margin-right: 0"
                  ></el-checkbox>
                  <span>(勾选才能使用自动收卡工具)</span>
                </el-form-item>
              </el-form>
              <el-divider style="margin: 10px 0"></el-divider>
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
              <template v-if="isHost">
                <el-form-item label="延迟时间：" v-if="roomData.type !== 2">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.playerA.delay"
                    :min="0"
                    size="small"
                    :step="0.1"
                    controls-position="right"
                    @change="synchroRoomSettings"
                  />
                  <span class="input-number-text">秒</span>
                </el-form-item>
                <el-form-item label="换卡次数：" v-if="roomData.type === 1">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.playerA.changeCardCount"
                    :min="0"
                    size="small"
                    controls-position="right"
                    @change="synchroRoomSettings"
                  />
                  <span class="input-number-text">次</span>
                </el-form-item>
              </template>
            </el-form>
            <el-divider style="margin: 10px 0"></el-divider>
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
              <template v-if="isHost">
                <el-form-item label="延迟时间：" v-if="roomData.type !== 2">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.playerB.delay"
                    :min="0"
                    size="small"
                    :step="0.1"
                    controls-position="right"
                    @change="synchroRoomSettings"
                  />
                  <span class="input-number-text">秒</span>
                </el-form-item>
                <el-form-item label="换卡次数：" v-if="roomData.type === 1">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.playerB.changeCardCount"
                    :min="0"
                    size="small"
                    controls-position="right"
                    @change="synchroRoomSettings"
                  />
                  <span class="input-number-text">次</span>
                </el-form-item>
              </template>
            </el-form>
            <el-divider style="margin: 10px 0"></el-divider>
            <div class="setting-title">通用设置</div>
            <el-form label-width="90px">
              <el-form-item label="BGM静音：">
                <el-checkbox v-model="roomSettings.bgmMuted" @change="synchroRoomSettings"></el-checkbox>
              </el-form-item>
              <el-form-item label="收取延时：">
                <el-input-number
                  class="input-number"
                  v-model="roomSettings.confirmDelay"
                  :min="0"
                  size="small"
                  controls-position="right"
                  @change="synchroRoomSettings"
                />
                <span class="input-number-text">秒</span>
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="操作记录" :name="2" class="tab-content">
          <el-scrollbar ref="scrollbar">
            <div class="log-list">
              <div class="log-list-item" v-for="(log, index) in logList" :key="index">
                <span v-for="(v, i) in log" :key="i" :style="v.style">{{ v.text }}</span>
              </div>
            </div>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { DefaultData } from "@/types";
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
  ElRadioGroup,
  ElRadio,
  ElInputNumber,
  ElColorPicker,
  ElScrollbar,
} from "element-plus";
import ws from "@/utils/webSocket";
import config from "@/config";
import Storage from "@/utils/Storage";

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
      rankList: config.rankList,
      difficultyList: config.difficultyList,
      predefineColors: config.predefineColors,
      gameTypeList: config.gameTypeList,
      roomSettings: {
        gameTimeLimit: 60,
        countDownTime: 180,
        format: 1,
        checkList: ["6", "7", "8", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
        rankList: ["L", "EX"],
        difficulty: 3,
        enableTools: true,
        bgmMuted: false,
        confirmDelay: 5,
        playerA: {
          color: "hsl(16, 100%, 50%)",
          delay: 5,
          changeCardCount: 2,
        },
        playerB: {
          color: "hsl(210, 100%, 56%)",
          delay: 5,
          changeCardCount: 2,
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
    ElRadioGroup,
    ElRadio,
    ElInputNumber,
    ElColorPicker,
    ElScrollbar,
  },
  computed: {},
  setup() {
    const store = useStore();
    const scrollbar = ref<InstanceType<typeof ElScrollbar>>();
    return {
      userData: computed(() => store.getters.userData),
      roomData: computed(() => store.getters.roomData),
      gameData: computed(() => store.getters.gameData),
      inRoom: computed(() => store.getters.inRoom),
      isHost: computed(() => store.getters.isHost),
      isWatcher: computed(() => store.getters.isWatcher),
      isPlayer: computed(() => store.getters.isPlayer),
      isPlayerA: computed(() => store.getters.isPlayerA),
      soloMode: computed(() => store.getters.soloMode),
      inGame: computed(() => store.getters.inGame),
      logList: computed(() => store.getters.logList),
      scrollbar,
    };
  },
  mounted() {
    this.userName = this.userData && this.userData.userName;
    this.roomType = this.roomData && this.roomData.type;
    const savedSettings = Storage.local.get("roomSettings");
    if (savedSettings) {
      this.roomSettings = {
        gameTimeLimit:
          (this.roomType ? savedSettings.gameTimeLimit[this.roomType] : savedSettings.gameTimeLimit[1]) ||
          this.roomSettings.gameTimeLimit,
        countDownTime:
          (this.roomType ? savedSettings.countDownTime[this.roomType] : savedSettings.countDownTime[1]) ||
          this.roomSettings.countDownTime,
        format: savedSettings.format || this.roomSettings.format,
        rankList: savedSettings.rankList || this.roomSettings.rankList,
        difficulty: savedSettings.difficulty || this.roomSettings.difficulty,
        enableTools: savedSettings.enableTools || this.roomSettings.enableTools,
        checkList: savedSettings.checkList || this.roomSettings.checkList,
        playerA: savedSettings.playerA || this.roomSettings.playerA,
        playerB: savedSettings.playerB || this.roomSettings.playerA,
        bgmMuted: savedSettings.bgmMuted || this.roomSettings.bgmMuted,
        confirmDelay: savedSettings.confirmDelay || this.roomSettings.confirmDelay,
      };
    } else if (this.roomType) {
      this.roomSettings.gameTimeLimit = this.gameTypeList[this.roomType - 1].timeLimit;
      this.roomSettings.countDownTime = this.gameTypeList[this.roomType - 1].countdown;
    }
    this.$store.commit("modify_room_settings", this.roomSettings);
  },
  watch: {
    userData(val) {
      this.userName = val.userName;
    },
    roomData(val) {
      if (this.roomType !== val.type) {
        this.roomType = val.type;
      }
      if (this.isHost) {
        const savedSettings = Storage.local.get("roomSettings");
        this.roomSettings.gameTimeLimit =
          (savedSettings && savedSettings.gameTimeLimit[this.roomType]) ||
          this.gameTypeList[this.roomType - 1].timeLimit;
        this.roomSettings.countDownTime =
          (savedSettings && savedSettings.countDownTime[this.roomType]) ||
          this.gameTypeList[this.roomType - 1].countdown;
      }
    },
    inRoom(val) {
      if (val) {
        this.tabIndex = 1;
      } else {
        this.tabIndex = 0;
      }
    },
    inGame(val) {
      if (val) {
        this.tabIndex = 2;
      }
    },
    logList() {
      this.$nextTick(() => {
        this.scrollbar?.setScrollTop(this.scrollbar?.wrap$?.offsetHeight as number);
      });
    },
  },
  methods: {
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
          return "bingo link赛";
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
    onFormatChange(value: number) {
      if (value % 2 === 0) {
        this.roomSettings.format++;
      }
      this.synchroRoomSettings();
    },
    synchroRoomSettings() {
      this.$store.commit("modify_room_settings", this.roomSettings);
    },
    getLogStyle(v: DefaultData) {
      const style: DefaultData = {};
      if (v.tag) {
        style.padding = "0 2px";
        switch (v.tag) {
          case "playerA":
            style.color = "var(--A-color)";
            break;
          case "playerB":
            style.color = "var(--B-color)";
            break;
          case "spellCard":
            style.fontWeight = 600;
            break;
          default:
        }
      } else if (v.color) {
        style.color = v.color;
      }
      return style;
    },
    getLogText(v: DefaultData) {
      if (v.tag) {
        switch (v.tag) {
          case "playerA":
            return this.roomData.names[0];
          case "playerB":
            return this.roomData.names[1];
          case "spellCard":
            return this.gameData.spells[v.index].name;
          default:
        }
      } else {
        return v.text;
      }
    },
    standUp() {
      this.$store.dispatch("stand_up");
    },
    sitDown() {
      this.$store.dispatch("sit_down");
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

.log-list {
  text-align: left;
  margin-right: 6px;
}

.log-list-item {
  margin-bottom: 4px;
}
</style>
