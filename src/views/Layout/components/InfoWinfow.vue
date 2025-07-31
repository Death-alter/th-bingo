<template>
  <div class="info-window">
    <div class="info">
      <el-tabs v-model="tabIndex" class="info-tabs">
        <el-tab-pane label="用户/房间" :name="0" class="tab-content">
          <el-scrollbar>
            <div class="user-info">
              <el-form label-width="90px">
                <el-form-item label="用户名：">
                  <div class="label-with-button">
                    <div class="userName">
                      <span>{{ localStore.username }}</span>
                    </div>
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
                  {{ roomTypeText }}
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
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="房间设置" :name="1" class="tab-content">
          <el-scrollbar>
            <template v-if="(!soloMode && isHost) || (soloMode && isPlayerA)">
              <div class="setting-title">房间设置</div>
              <el-form label-width="90px">
                <el-form-item label="规则：">
                  <div class="label-with-button">
                    <div>
                      <el-select v-if="showTypeInput" v-model="roomSettings.type" style="width: 150px">
                        <el-option
                          v-for="(item, index) in gameTypeList"
                          :key="index"
                          :label="item.name"
                          :value="item.type"
                        ></el-option>
                      </el-select>
                      <span v-else> {{ roomTypeText }}</span>
                    </div>
                    <el-button link type="primary" @click="editType" v-if="!inGame">{{
                        showTypeInput ? "确认" : "修改"
                      }}</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="比赛时长：" v-if="roomData.type !== BingoType.LINK">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.gameTimeLimit[roomData.type]"
                    :min="10"
                    :max="180"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('game_time')"
                  />
                  <span class="input-number-text">分钟</span>
                </el-form-item>
                <el-form-item label="倒计时：">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.countdownTime[roomData.type]"
                    :min="0"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('countdown')"
                  />
                  <span class="input-number-text">秒</span>
                </el-form-item>
                <el-form-item label="选卡CD：">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.cdTime"
                    :min="0"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('cd_time')"
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
                    :disabled="inMatch"
                    size="small"
                    controls-position="right"
                    @change="onFormatChange"
                  />
                </el-form-item>
                <el-form-item label="卡池设定：">
                  <el-select
                    v-model="roomSettings.spell_version"
                    style="width: 120px"
                    @change="roomStore.updateRoomConfig('spell_version')"
                    :disabled="inGame"
                  >
                    <el-option
                      v-for="(item, index) in spellVersionList"
                      :key="index"
                      :label="item.name"
                      :value="item.type"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="AI练习：" v-if="roomStore.practiceMode && roomSettings.spell_version == 1 ">
                  <el-checkbox
                    v-model="roomSettings.use_ai"
                    :disabled="inGame || roomSettings.blind_setting > 1 || roomSettings.dual_board > 0"
                    @change="roomStore.updateRoomConfig('use_ai')"
                    style="margin-right: 0"
                  ></el-checkbox>
                </el-form-item>
                <el-form-item label="AI策略：" v-if="roomSettings.use_ai">
                  <el-select
                    v-model="roomSettings.ai_strategy_level"
                    style="width: 120px"
                    @change="roomStore.updateRoomConfig('ai_strategy_level')"
                    :disabled="inGame"
                  >
                    <el-option
                      v-for="(item, index) in aiStrategyLevelList"
                      :key="index"
                      :label="item.name"
                      :value="item.type"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="AI风格：" v-if="roomSettings.use_ai && roomSettings.ai_strategy_level >= 3">
                  <el-select
                    v-model="roomSettings.ai_style"
                    style="width: 120px"
                    @change="roomStore.updateRoomConfig('ai_style')"
                    :disabled="inGame"
                  >
                    <el-option
                      v-for="(item, index) in aiStyleLevelList"
                      :key="index"
                      :label="item.name"
                      :value="item.type"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="AI底力：" v-if="roomSettings.use_ai">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.ai_base_power"
                    :min="1"
                    :max="10"
                    :step="1"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('ai_base_power')"
                  />
                  <span class="input-number-text">级</span>
                </el-form-item>
                <el-form-item label="AI熟练度：" v-if="roomSettings.use_ai">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.ai_experience"
                    :min="1"
                    :max="10"
                    :step="1"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('ai_experience')"
                  />
                  <span class="input-number-text">级</span>
                </el-form-item>
                <el-form-item label="盲盒设定：">
                  <el-select
                    v-model="roomSettings.blind_setting"
                    style="width: 120px"
                    @change="roomStore.updateRoomConfig('blind_setting')"
                    :disabled="inGame"
                  >
                    <el-option
                      v-for="(item, index) in blindTypeList"
                      :key="index"
                      :label="item.name"
                      :value="item.type"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="揭示等级" v-if="roomSettings.blind_setting > 1 &&
                  !(roomSettings.type == BingoType.BP && roomSettings.blind_setting == 3)">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.blind_reveal_level"
                    :min="0"
                    :max="4"
                    :step="1"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('blind_reveal_level')"
                  />
                  <span class="input-number-text"></span>
                </el-form-item>
                <el-form-item label="双重盘面：" v-if="roomSettings.type == BingoType.STANDARD">
                  <el-select
                    v-model="roomSettings.dual_board"
                    style="width: 120px"
                    @change="roomStore.updateRoomConfig('dual_board')"
                    :disabled="inGame"
                  >
                    <el-option
                      v-for="(item, index) in dualTypeList"
                      :key="index"
                      :label="item.name"
                      :value="item.type"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="转换格数：" v-if="roomSettings.dual_board > 0 && roomSettings.type == BingoType.STANDARD">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.portal_count"
                    :min="1"
                    :max="25"
                    :step="1"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('portal_count')"
                  />
                  <span class="input-number-text">格</span>
                </el-form-item>
                <el-form-item label="差异等级：" v-if="roomSettings.dual_board > 0 && roomSettings.type == BingoType.STANDARD">
                  <el-input-number
                    class="input-number"
                    v-model="roomSettings.diff_level"
                    :min="0"
                    :max="5"
                    :step="1"
                    :disabled="inGame"
                    size="small"
                    controls-position="right"
                    @change="roomStore.updateRoomConfig('diff_level')"
                  />
                  <span class="input-number-text"></span>
                </el-form-item>

                <el-form-item label="作品BP：">
                  <el-checkbox
                    v-model="roomSettings.gamebp"
                    :disabled="inMatch"
                    @change="saveRoomSettings"
                    style="margin-right: 0"
                  ></el-checkbox>
                </el-form-item>
                <el-form-item label="全局BP：" v-if="roomSettings.gamebp">
                  <el-checkbox
                    v-model="roomSettings.matchbp"
                    :disabled="inGame"
                    @change="saveRoomSettings"
                    style="margin-right: 0"
                  ></el-checkbox>
                </el-form-item>
                <el-form-item label="题目：" v-if="!roomSettings.gamebp">
                  <el-checkbox-group
                    v-model="roomSettings.checkList"
                    style="text-align: left"
                    :min="1"
                    @change="roomStore.updateRoomConfig('games')"
                  >
                    <el-checkbox v-for="(item, index) in gameList" :value="item.code" :key="index">{{
                        item.name
                      }}</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="符卡来源：" v-if="!roomSettings.gamebp">
                  <el-checkbox-group
                    v-model="roomSettings.rankList"
                    style="text-align: left"
                    :min="1"
                    @change="roomStore.updateRoomConfig('ranks')"
                  >
                    <el-checkbox v-for="(item, index) in rankList" :value="item" :key="index">{{ item }}</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="bingo难度：">
                  <el-radio-group
                    v-model="roomSettings.difficulty"
                    style="text-align: left"
                    :disabled="inGame"
                    @change="roomStore.updateRoomConfig('difficulty')"
                  >
                    <el-radio v-for="(item, index) in difficultyList" :value="item.value" :key="index">{{
                        item.name
                      }}</el-radio>
                  </el-radio-group>
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
                  @change="saveRoomSettings"
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
                    @change="saveRoomSettings"
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
                    @change="saveRoomSettings"
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
                  @change="saveRoomSettings"
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
                    @change="saveRoomSettings"
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
                    @change="saveRoomSettings"
                  />
                  <span class="input-number-text">次</span>
                </el-form-item>
              </template>
            </el-form>
            <el-divider style="margin: 10px 0"></el-divider>
            <div class="setting-title">通用设置</div>
            <el-form label-width="90px">
              <el-form-item label="BGM静音：">
                <el-checkbox v-model="roomSettings.bgmMuted" @change="saveRoomSettings"></el-checkbox>
              </el-form-item>
              <el-form-item label="收取延时：">
                <el-input-number
                  class="input-number"
                  v-model="roomSettings.confirmDelay"
                  :min="0"
                  size="small"
                  controls-position="right"
                  @change="saveRoomSettings"
                />
                <span class="input-number-text">秒</span>
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="操作记录" :name="2" class="tab-content">
          <el-scrollbar ref="scrollbar">
            <div class="log-list">
              <div class="log-list-item" v-for="(log, index) in gameLogs" :key="index" v-html="log"></div>
            </div>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick } from "vue";
import {
  ElTabs,
  ElTabPane,
  ElDivider,
  ElForm,
  ElFormItem,
  ElButton,
  ElMessage,
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
import Config from "@/config";
import { useRoomStore } from "@/store/RoomStore";
import { useLocalStore } from "@/store/LocalStore";
import { useGameStore } from "@/store/GameStore";
import { BingoType } from "@/types";

const roomStore = useRoomStore();
const localStore = useLocalStore();
const gameStore = useGameStore();
const scrollbar = ref<InstanceType<typeof ElScrollbar>>();

const tabIndex = ref(0);
const showTypeInput = ref(false);
const gameList = Config.gameOptionList;
const rankList = Config.rankList;
const difficultyList = Config.difficultyList;
const predefineColors = Config.predefineColors;
const gameTypeList = computed(() => {
  if (soloMode.value) {
    return [...Config.gameTypeList]
  } else {
    return [...Config.gameTypeList]
  }
});
const roomSettings = computed(() => roomStore.roomSettings);
const roomData = computed(() => roomStore.roomData);
const gameLogs = computed(() => gameStore.gameLogs);
const inRoom = computed(() => roomStore.inRoom);
const isPlayer = computed(() => roomStore.isPlayer);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isHost = computed(() => roomStore.isHost);
const isWatcher = computed(() => roomStore.isWatcher);
const soloMode = computed(() => roomStore.soloMode);
const inGame = computed(() => roomStore.inGame);
const inMatch = computed(() => roomStore.inMatch);

const roomTypeText = computed(() => {
  switch (roomData.value.type) {
    case 1:
      return "bingo 标准赛";
    case 2:
      return "bingo BP赛";
    case 3:
      return "bingo link赛";
    default:
      return "未选择比赛类型";
  }
});

const blindTypeList = [
  {
    name: "关闭",
    type: 1
  },
  {
    name: "模式1",
    type: 2
  },
  {
    name: "模式2",
    type: 3
  }
];

const spellVersionList = [
  {
    name: "S6前瞻卡池",
    type: 1
  },
  {
    name: "S5卡池",
    type: 3
  },
  {
    name: "S3卡池",
    type: 4
  },
  {
    name: "史卡池（你确定吗）",
    type: 5
  },
  {
    name: "小数点（th11-13替换）",
    type: 6
  },
  {
    name: "缘（th10替换）",
    type: 7
  }
];

const dualTypeList = [
  {
    name: "关闭",
    type: 0
  },
  {
    name: "开启",
    type: 1
  }
]

const aiStrategyLevelList = [
  {
    name: "初级",
    type: 1
  },
  {
    name: "中级",
    type: 2
  },
  {
    name: "高级",
    type: 3
  },
]

const aiStyleLevelList = [
  {
    name: "平衡",
    type: 0
  },
  {
    name: "进攻",
    type: 1
  },
  {
    name: "防守",
    type: 2
  },
]

const logout = () => {
  localStore.logout();
};

const leaveRoom = () => {
  roomStore.leaveRoom();
};

const copyPassword = () => {
  navigator.clipboard
    .writeText(roomStore.roomId)
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
};

const editType = () => {
  if (showTypeInput.value === false) {
    showTypeInput.value = true;
  } else {
    if (roomStore.roomConfig.type !== roomSettings.value.type) {
      roomStore.updateRoomConfig("type").then(() => {
        showTypeInput.value = false;
      });
      roomStore.updateRoomConfig("game_time");
      roomStore.updateRoomConfig("countdown");
    } else {
      showTypeInput.value = false;
    }
  }
};
const saveRoomSettings = () => {
  roomStore.saveRoomSettings();
};
const onFormatChange = (value) => {
  if (value % 2 === 0) {
    roomStore.roomSettings.format++;
  }
  roomStore.updateRoomConfig("need_win");
};
const standUp = () => {
  roomStore.standUp();
};
const sitDown = () => {
  roomStore.sitDown();
};

watch(inRoom, (val) => {
  if (val) {
    tabIndex.value = 1;
  } else {
    tabIndex.value = 0;
  }
});

watch(inGame, (val) => {
  if (val) {
    tabIndex.value = 2;
  }
});

watch(
  () => gameLogs,
  (val) => {
    nextTick(() => {
      scrollbar.value?.setScrollTop((scrollbar.value as any)?.wrap$?.offsetHeight as number);
    });
  }
);
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
