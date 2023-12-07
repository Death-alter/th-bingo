<template>
  <div class="room">
    <room-layout ref="layoutRef" v-model:selected-spell-index="selectedSpellIndex" :menu="menu" :multiple="isBingoBp">
      <template #left>
        <score-board
          class="change-card"
          v-if="isBingoStandard"
          :size="48"
          :manual="soloMode ? isPlayerA : isHost"
          label="换卡次数"
          v-model="cardCount[0]"
          @add="addChangeCardCount(0)"
          @minus="removeChangeCardCount(0)"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分" v-model="playerAScore">
          <template v-if="isBingoLink">
            <div class="spell-card-score-text">得分</div>
            <div class="spell-card-score-text">{{ timeFormat(spendTimeA) }}</div>
          </template>

          <template #score v-if="isBingoLink">
            {{ playerAScore * 2 + (spendTimeScore > 0 ? " + " + spendTimeScore.toFixed(1) : "") }}
          </template>
        </score-board>

        <el-button
          class="alert-button"
          type="primary"
          v-if="isHost"
          @click="alterPlayer(roomData.names[0])"
          :disabled="!inGame"
        >
          警告
        </el-button>
      </template>

      <template #right>
        <score-board
          class="change-card"
          v-if="isBingoStandard"
          :size="48"
          :manual="soloMode ? isPlayerB : isHost"
          label="换卡次数"
          v-model="cardCount[1]"
          @add="addChangeCardCount(1)"
          @minus="removeChangeCardCount(1)"
        ></score-board>
        <score-board class="spell-card-score-card" :size="30" label="得分" v-model="playerBScore">
          <template v-if="isBingoLink">
            <div class="spell-card-score-text">得分</div>
            <div class="spell-card-score-text">{{ timeFormat(spendTimeB) }}</div>
          </template>
          <template #score v-if="isBingoLink">
            {{ playerBScore * 2 + (spendTimeScore < 0 ? "+" + (-spendTimeScore).toFixed(1) : "") }}
          </template>
        </score-board>
        <el-button
          class="alert-button"
          type="primary"
          v-if="isHost"
          @click="alterPlayer(roomData.names[1])"
          :disabled="!inGame"
        >
          警告
        </el-button>
      </template>

      <template #extra>
        <bingo-link-effect :route-a="routeA" :route-b="routeB" v-if="isBingoLink" />
        <game-bp v-if="isBpPhase" v-model="bpCode"></game-bp>
      </template>

      <template #widget>
        <count-down
          ref="countdownRef"
          :size="30"
          :start-time="linkStartTime"
          :mode="countdownMode"
          @complete="onCountDownComplete"
          v-show="inGame"
        ></count-down>
      </template>

      <template #cell="{ item, index }" v-if="isBingoLink">
        <spell-card-cell
          :name="item.name"
          :desc="item.desc"
          :level="item.star"
          @click="selectSpellCardLink(index)"
          :selected="availableIndexList.indexOf(index) !== -1"
          :disabled="availableIndexList.indexOf(index) === -1"
          :status="gameData.status[index] < 4 ? 0 : gameData.status[index]"
          :index="index"
        ></spell-card-cell>
      </template>

      <template #button-center>
        <template v-if="!soloMode && isHost">
          <el-button type="primary" v-if="!inGame && !isBpPhase" @click="startGame">开始比赛</el-button>
          <el-button type="primary" v-if="isBpPhase" @click="drawSpellCard" :disabled="banPickInfo.phase < 99">
            抽取符卡
          </el-button>
          <el-button type="primary" v-if="inGame && winFlag === 0" @click="stopGame">结束比赛</el-button>
          <el-button type="primary" v-if="winFlag !== 0" @click="confirmWinner">
            确认：{{ winFlag < 0 ? roomData.names[0] : roomData.names[1] }}获胜
          </el-button>
        </template>

        <template v-if="soloMode && isPlayerA">
          <el-button type="primary" v-if="!inGame && !isBpPhase" @click="startGame">开始比赛</el-button>
          <el-button type="primary" v-if="banPickInfo.phase === 9999" @click="drawSpellCard">抽取符卡</el-button>
        </template>

        <template v-if="isPlayer">
          <template v-if="inGame">
            <template v-if="isBingoStandard">
              <confirm-select-button
                @click="confirmSelect"
                :disabled="selectedSpellIndex < 0 || gamePaused"
                v-if="!spellCardSelected"
                :cooldown="roomConfig.cd_time"
                :startTime="selectCooldownStart"
                :immediate="gamePhase > 1"
                text="选择符卡"
              ></confirm-select-button>
              <confirm-select-button
                @click="confirmAttained"
                v-if="spellCardSelected"
                :disabled="gamePhase < 2 || gamePaused"
                :cooldown="roomSettings.confirmDelay"
                :startTime="attainCooldownStart"
                text="确认收取"
              ></confirm-select-button
            ></template>
            <template v-if="isBingoBp">
              <el-button
                type="primary"
                @click="confirmSelect"
                :disabled="!isMyTurn || !bingoBpPhase"
                v-if="!gameData.ban_pick"
                >{{ bingoBpPhase ? (isMyTurn ? "选择符卡" : "等待对手选择符卡") : "等待房主操作" }}</el-button
              >
              <el-button
                type="primary"
                @click="confirmBan"
                v-if="gameData.ban_pick"
                :disabled="!isMyTurn || !bingoBpPhase"
                >{{ bingoBpPhase ? (isMyTurn ? "禁用符卡" : "等待对手禁用符卡") : "等待房主操作" }}</el-button
              >
            </template>
            <template v-if="isBingoLink">
              <el-button
                type="primary"
                @click="confirmSelect"
                :disabled="gamePaused || !routeComplete"
                v-if="(gamePhase === 1 || !confirmed) && !(gamePhase > 1 && routeComplete)"
                >{{ confirmed ? "取消确认" : "确认路线" }}</el-button
              >
            </template>
          </template>

          <template v-if="isBpPhase">
            <el-button
              type="primary"
              v-if="banPickInfo.phase < 11"
              :disabled="!(isPlayerA && playerACanBP) && !(isPlayerB && playerBCanBP)"
              @click="playerBanPick"
              >确定</el-button
            >
            <el-button type="primary" v-if="banPickInfo.phase === 11" @click="confirmOpenEX(true)">开启</el-button>
            <el-button type="primary" v-if="banPickInfo.phase === 11" @click="confirmOpenEX(false)">不开启</el-button>
          </template>
        </template>

        <template v-if="isBingoLink">
          <template v-if="soloMode && isPlayerA">
            <el-button type="primary" v-if="gamePhase > 1 && winFlag === 0 && routeComplete" @click="stopGame"
              >结束比赛</el-button
            >
          </template>
        </template>
      </template>

      <template #button-left-1>
        <template v-if="!soloMode && isHost">
          <template v-if="!isBingoStandard || !inGame">
            <el-button size="small" :disabled="inGame" @click="resetRoom">重置房间</el-button>
          </template>
          <template v-else>
            <el-button size="small" :disabled="gamePhase !== 2" v-if="gamePaused" @click="resumeGame">
              继续比赛
            </el-button>
            <el-button size="small" :disabled="gamePhase !== 2" v-else @click="pauseGame">暂停比赛</el-button>
          </template>
        </template>

        <template v-if="soloMode && isPlayerA">
          <el-button v-if="isPlayerA && !inGame" size="small" @click="resetRoom">重置房间</el-button>
          <el-button v-if="isPlayerA && inGame" size="small" @click="stopGame">结束比赛</el-button>
        </template>
      </template>

      <template #button-right-1>
        <template v-if="isOwner">
          <template v-if="isBingoStandard">
            <el-button size="small" :disabled="gamePhase !== 2" v-if="gamePaused" @click="resumeGame">
              继续比赛
            </el-button>
            <el-button size="small" :disabled="gamePhase !== 2" v-else @click="pauseGame">暂停比赛</el-button>
          </template>
          <template v-if="isBingoBp">
            <el-button size="small" @click="nextRound" :disabled="gamePhase !== 2 || gameData.ban_pick !== 2"
              >进入下轮</el-button
            >
          </template>
          <template v-if="isBingoLink">
            <el-button size="small" @click="linkTiming" :disabled="gamePhase < 2 || gamePhase > 3 || gamePaused">{{
              gamePhase === 3 && !gameData.link_data.start_ms_b ? "开始计时" : "结束计时"
            }}</el-button>
          </template>
        </template>
      </template>
    </room-layout>
  </div>
</template>

<script lang="ts">
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import { Role, BingoType, BpStatus } from "@/types";
import RoomLayout from "./components/roomLayout.vue";
import BingoLinkEffect from "@/components/bingo-effect/link.vue";
import ScoreBoard from "@/components/score-board.vue";
import CountDown from "@/components/count-down.vue";
import GameBp from "@/components/game-bp.vue";
import SpellCardCell from "@/components/spell-card-cell.vue";
import ConfirmSelectButton from "@/components/button-with-cooldown.vue";
import { ElButton, ElMessageBox, ElRadioGroup, ElRadio } from "element-plus";
import Mit from "@/mitt";
import Storage from "@/utils/Storage";
import GameTime from "@/utils/GameTime";

export default defineComponent({
  name: "Room",
  components: {
    RoomLayout,
    BingoLinkEffect,
    ScoreBoard,
    ElButton,
    ConfirmSelectButton,
    CountDown,
    GameBp,
    SpellCardCell,
  },
  setup() {
    const store = useStore();
    const countdownRef = ref<InstanceType<typeof CountDown>>();
    const layoutRef = ref<InstanceType<typeof RoomLayout>>();

    const gameData = computed(() => store.getters.gameData);
    const roomData = computed(() => store.getters.roomData);
    const roomSettings = computed(() => store.getters.roomSettings);
    const roomConfig = computed(() => store.getters.roomData.room_config);
    const banPickInfo = computed(() => store.getters.banPickInfo);
    const soloMode = computed(() => store.getters.soloMode);
    const userRole = computed(() => store.getters.userRole);
    const isHost = computed(() => store.getters.userRole === Role.HOST);
    const isPlayer = computed(() => store.getters.userRole === Role.PLAYER);
    const isWatcher = computed(() => store.getters.userRole === Role.WATHCER);
    const isPlayerA = computed(() => store.getters.isPlayerA);
    const isPlayerB = computed(() => store.getters.isPlayerB);
    const isOwner = computed(() => (soloMode.value && isPlayerA.value) || (!soloMode.value && isHost.value));
    const playerAName = computed(() => store.getters.roomData.names[0]);
    const playerBName = computed(() => store.getters.roomData.names[1]);
    const isBingoStandard = computed(() => store.getters.roomData.type === BingoType.STANDARD);
    const isBingoBp = computed(() => store.getters.roomData.type === BingoType.BP);
    const isBingoLink = computed(() => store.getters.roomData.type === BingoType.LINK);
    const inGame = computed(() => store.getters.inGame);
    const inMatch = computed(() => store.getters.inMatch);
    const isBpPhase = computed(
      () =>
        store.getters.banPickInfo.phase &&
        store.getters.banPickInfo.phase > 0 &&
        (store.getters.banPickInfo.phase < 99 || !inGame.value)
    );
    const bpStatus = computed(() => store.getters.bpStatus);
    const playerACanBP = computed(
      () =>
        bpStatus.value === BpStatus.IS_A_BAN ||
        bpStatus.value === BpStatus.IS_A_PICK ||
        bpStatus.value === BpStatus.SELECT_OPEN_EX
    );
    const playerBCanBP = computed(
      () =>
        bpStatus.value === BpStatus.IS_B_BAN ||
        bpStatus.value === BpStatus.IS_B_PICK ||
        bpStatus.value === BpStatus.SELECT_OPEN_EX
    );
    const playerASelectedIndex = computed(() => store.getters.playerASelectedIndex);
    const playerBSelectedIndex = computed(() => store.getters.playerBSelectedIndex);
    const gamePaused = computed(() => {
      if (isBingoLink.value) {
        if (gameData.value.link_data) {
          const link_data = gameData.value.link_data;
          if (gamePhase.value === 2 && link_data.start_ms_a && link_data.end_ms_a) {
            return true;
          } else if (gamePhase.value === 3 && link_data.start_ms_b && link_data.end_ms_b) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return store.getters.gamePaused;
      }
    });
    const gamePhase = computed(() => store.getters.gameData.phase || 0);
    const timeMistake = computed(() => store.getters.heartBeat.timeMistake);
    const spellCardSelected = computed(() => {
      if (isPlayerA.value) {
        return playerASelectedIndex.value !== -1;
      }
      if (isPlayerB.value) {
        return playerBSelectedIndex.value !== -1;
      }
      return false;
    });
    const selectCooldownStart = computed(() => {
      const lastGetTime = store.getters.gameData.last_get_time;
      if (isPlayerA.value) {
        return lastGetTime[0];
      } else if (isPlayerB.value) {
        return lastGetTime[1];
      } else {
        return 0;
      }
    });
    const menu = computed<{ label: string; value: number; tag?: string }[]>(() => {
      let data: { label: string; value: number; tag?: string }[] = [];
      switch (roomData.value.type) {
        case BingoType.STANDARD:
          if (soloMode.value) {
            data = [
              {
                label: "置空",
                value: 0,
              },
            ];
            if (isPlayerA.value) {
              data = [
                ...data,
                {
                  label: "选择",
                  value: 1,
                  tag: "playerA",
                },
                {
                  label: "收取",
                  value: 5,
                  tag: "playerA",
                },
              ];
            }
            if (isPlayerB.value) {
              data = [
                ...data,
                {
                  label: "选择",
                  value: 3,
                  tag: "playerB",
                },
                {
                  label: "收取",
                  value: 7,
                  tag: "playerB",
                },
              ];
            }
          } else {
            if (isHost.value) {
              data = [
                {
                  label: "置空",
                  value: 0,
                },
                {
                  label: "左侧玩家选择",
                  value: 1,
                  tag: "playerA",
                },
                {
                  label: "右侧玩家选择",
                  value: 3,
                  tag: "playerB",
                },
                {
                  label: "两侧玩家选择",
                  value: 2,
                },
                {
                  label: "左侧玩家收取",
                  value: 5,
                  tag: "playerA",
                },
                {
                  label: "右侧玩家收取",
                  value: 7,
                  tag: "playerB",
                },
              ];
            }
          }
          break;
        case BingoType.BP:
          if (isHost.value) {
            data = [
              {
                label: "收取失败",
                value: 0,
              },
              {
                label: "禁用",
                value: -1,
              },
              {
                label: "左侧玩家选择",
                value: 1,
                tag: "playerA",
              },
              {
                label: "右侧玩家选择",
                value: 3,
                tag: "playerB",
              },
              // {
              //   label: "两侧玩家选择",
              //   value: 2,
              // },
              {
                label: "左侧玩家收取",
                value: 5,
                tag: "playerA",
              },
              {
                label: "右侧玩家收取",
                value: 7,
                tag: "playerB",
              },
            ];
          }
          break;
        case BingoType.LINK:
          if (soloMode.value) {
            data = [
              {
                label: "置空",
                value: 0,
              },
            ];
            if (isPlayerA.value) {
              data = [
                ...data,
                {
                  label: "收取",
                  value: 5,
                  tag: "playerA",
                },
              ];
            }
            if (isPlayerB.value) {
              data = [
                ...data,
                {
                  label: "收取",
                  value: 7,
                  tag: "playerB",
                },
              ];
            }
          } else {
            if (isHost.value) {
              data = [
                {
                  label: "置空",
                  value: 0,
                },
                {
                  label: "两侧玩家收取",
                  value: 6,
                },
                {
                  label: "左侧玩家收取",
                  value: 5,
                  tag: "playerA",
                },
                {
                  label: "右侧玩家收取",
                  value: 7,
                  tag: "playerB",
                },
              ];
            }
          }
          break;
      }
      return data;
    });

    const selectedSpellIndex = ref(-1);
    const winFlag = ref(0);
    const bpCode = ref("");
    const attainCooldownStart = ref(0);
    const cd = Storage.local.get("attainCooldownStart");
    if (cd) {
      attainCooldownStart.value = cd;
    }

    //standard
    const oldSumArr = ref<number[]>([]);
    const playerAScore = ref(0);
    const playerBScore = ref(0);
    const cardCount = ref([2, 2]);
    const decideStandard = (status) => {
      const available: number[] = new Array(12).fill(2);
      const sumArr: number[] = new Array(12).fill(0);
      winFlag.value = 0;
      let countA = 0;
      let countB = 0;
      let scoreA = 0;
      let scoreB = 0;
      status.forEach((item: number, index: number) => {
        const rowIndex = Math.floor(index / 5);
        const columnIndex = index % 5;
        if (item === 5) {
          countA++;
          scoreA += 1;
          if (available[rowIndex] > 0) available[rowIndex] -= 2;
          if (available[columnIndex + 5] > 0) available[columnIndex + 5] -= 2;
          sumArr[rowIndex] -= 1;
          sumArr[columnIndex + 5] -= 1;
          if (index % 6 === 0) {
            sumArr[10] -= 1;
            if (available[10] > 0) available[10] -= 2;
          }
          if (index && index !== 24 && index % 4 === 0) {
            sumArr[11] -= 1;
            if (available[11] > 0) available[11] -= 2;
          }
        } else if (item === 7) {
          countB++;
          scoreB += 1;
          if (available[rowIndex] % 2 === 0) available[rowIndex] -= 1;
          if (available[columnIndex + 5] % 2 === 0) available[columnIndex + 5] -= 1;
          sumArr[rowIndex] += 1;
          sumArr[columnIndex + 5] += 1;
          if (index % 6 === 0) {
            sumArr[10] += 1;
            if (available[10] % 2 === 0) available[10] -= 1;
          }
          if (index && index !== 24 && index % 4 === 0) {
            sumArr[11] += 1;
            if (available[11] % 2 === 0) available[11] -= 1;
          }
        }
      });

      let gamePointFlag = false;
      for (let i = 0; i < 12; i++) {
        if (sumArr[i] === -5) {
          winFlag.value = -(i + 1);
          break;
        } else if (sumArr[i] === 5) {
          winFlag.value = i + 1;
          break;
        } else if (
          (sumArr[i] === -4 && oldSumArr.value[i] > -4 && isPlayerB.value) ||
          (sumArr[i] === 4 && oldSumArr.value[i] < 4 && isPlayerA.value)
        ) {
          gamePointFlag = true;
        }
      }
      if (gamePointFlag) {
        Mit.emit("game_point");
      }
      oldSumArr.value = sumArr;

      playerAScore.value = scoreA;
      playerBScore.value = scoreB;

      if (countA >= 13) {
        winFlag.value = -13;
      }
      if (countB >= 13) {
        winFlag.value = 13;
      }
      if (winFlag.value !== 0) {
        if (soloMode.value && isPlayerA.value) {
          confirmWinner();
        }
        if (!soloMode.value) {
          layoutRef.value?.showAlert("已满足胜利条件，等待房主判断胜负", "red");
        }
      }

      if (GameTime.timeout > 0 && countA !== countB) {
        layoutRef.value?.showAlert("游戏时间到，等待房主判断胜负", "red");
        if (isOwner.value && gamePhase.value !== 0) {
          store.dispatch("set_phase", { phase: 0 });
        }
      }
    };

    //bp
    const isMyTurn = computed(
      () =>
        (store.getters.isPlayerA && store.getters.gameData.whose_turn === 0) ||
        (store.getters.isPlayerB && store.getters.gameData.whose_turn === 1)
    );
    const bingoBpPhase = computed(() => store.getters.gameData.ban_pick !== 2);
    const nextRound = () => {
      store.dispatch("next_round");
    };
    const confirmBan = () => {
      store.dispatch("update_spell", { idx: selectedSpellIndex.value, status: -1 }).then(() => {
        selectedSpellIndex.value = -1;
      });
    };
    const decideBp = (status) => {
      const available: number[] = new Array(12).fill(2);
      const sumArr: number[] = new Array(12).fill(0);
      winFlag.value = 0;
      let count = 0;
      let scoreA = 0;
      let scoreB = 0;
      status.forEach((item: number, index: number) => {
        const rowIndex = Math.floor(index / 5);
        const columnIndex = index % 5;
        if (item == -1) {
          count++;
        }
        if (item === 5) {
          count++;
          scoreA += gameData.value.spells[index].star;
          if (available[rowIndex] > 0) available[rowIndex] -= 2;
          if (available[columnIndex + 5] > 0) available[columnIndex + 5] -= 2;
          sumArr[rowIndex] -= 1;
          sumArr[columnIndex + 5] -= 1;
          if (index % 6 === 0) {
            sumArr[10] -= 1;
            if (available[10] > 0) available[10] -= 2;
          }
          if (index && index % 4 === 0) {
            sumArr[11] -= 1;
            if (available[11] > 0) available[11] -= 2;
          }
        } else if (item === 7) {
          count++;
          scoreB += gameData.value.spells[index].star;
          if (available[rowIndex] % 2 === 0) available[rowIndex] -= 1;
          if (available[columnIndex + 5] % 2 === 0) available[columnIndex + 5] -= 1;
          sumArr[rowIndex] += 1;
          sumArr[columnIndex + 5] += 1;
          if (index % 6 === 0) {
            sumArr[10] += 1;
            if (available[10] % 2 === 0) available[10] -= 1;
          }
          if (index && index % 4 === 0) {
            sumArr[11] += 1;
            if (available[11] % 2 === 0) available[11] -= 1;
          }
        }
      });

      for (let i = 0; i < 12; i++) {
        if (sumArr[i] === -5) {
          winFlag.value = -(i + 1);
          break;
        } else if (sumArr[i] === 5) {
          winFlag.value = i + 1;
          break;
        }
      }

      playerAScore.value = scoreA;
      playerBScore.value = scoreB;

      if (count == 25) {
        if (scoreB - scoreA < 0) {
          winFlag.value = -25;
        } else {
          winFlag.value = 25;
        }
      }
      if (winFlag.value !== 0) {
        layoutRef.value?.showAlert("已满足胜利条件，等待房主判断胜负", "red");
      }

      if (GameTime.timeout > 0 && scoreA !== scoreB) {
        layoutRef.value?.showAlert("游戏时间到，等待房主判断胜负", "red");
        if (isOwner.value && gamePhase.value !== 0) {
          store.dispatch("set_phase", { phase: 0 });
        }
      }
    };

    //link
    const availableIndexList = ref<number[]>([]);
    const routeA = ref<number[]>([]);
    const routeB = ref<number[]>([]);
    const spendTimeA = ref(0);
    const spendTimeB = ref(0);
    const linkStartTime = ref(0);
    const confirmed = ref(false);
    const countdownMode = computed(() => {
      if (isBingoLink.value && gamePhase.value > 1) {
        return "stopwatch";
      }
      return "countdown";
    });
    const routeComplete = computed(() => {
      if (store.getters.isPlayerA) {
        return routeA.value[routeA.value.length - 1] === 24;
      }
      if (store.getters.isPlayerB) {
        return routeB.value[routeB.value.length - 1] === 20;
      }
      return false;
    });
    const spendTimeScore = computed(() => {
      if (gamePhase.value !== 4) {
        return 0;
      }
      const delta = (spendTimeB.value - spendTimeA.value) / 10000;
      return delta;
      // return delta > 0 ? Math.floor(delta) : Math.ceil(delta);
    });
    const linkTiming = () => {
      if (gamePhase.value === 2) {
        store.dispatch("set_phase", { phase: 3 }).then(() => {
          store.dispatch("link_time", { whose: 0, event: 3 }).then(() => {
            countdownRef.value?.stop();
          });
        });
      } else if (gamePhase.value === 3) {
        if (!gameData.value.link_data.start_ms_b) {
          store.dispatch("link_time", { whose: 1, event: 1 }).then(() => {
            countdownRef.value?.start();
          });
        } else {
          store.dispatch("link_time", { whose: 1, event: 3 }).then(() => {
            store.dispatch("set_phase", { phase: 4 }).then(() => {
              countdownRef.value?.stop();
            });
          });
        }
      }
    };
    const getAvailableIndexList = () => {
      let linkList: number[];
      let index: number;
      let endIndex: number;
      if (isPlayerA.value) {
        linkList = routeA.value;
        index = linkList[linkList.length - 1];
        endIndex = 24;
      } else if (isPlayerB.value) {
        linkList = routeB.value;
        index = linkList[linkList.length - 1];
        endIndex = 20;
      } else {
        availableIndexList.value = [];
        return;
      }
      if (index === endIndex) {
        availableIndexList.value = [index];
        return;
      }
      const list = [index - 6, index - 5, index - 4, index - 1, index, index + 1, index + 4, index + 5, index + 6];
      if (index < 5) {
        list[0] = -1;
        list[1] = -1;
        list[2] = -1;
      } else if (index > 19) {
        list[6] = -1;
        list[7] = -1;
        list[8] = -1;
      }

      if (index % 5 === 0) {
        list[0] = -1;
        list[3] = -1;
        list[6] = -1;
      } else if (index % 5 === 4) {
        list[2] = -1;
        list[5] = -1;
        list[8] = -1;
      }

      availableIndexList.value = list.filter((item) => {
        if (item === linkList[0]) return false;
        return item !== -1 && (linkList.indexOf(item) === -1 || item === index);
      });
    };
    const selectSpellCardLink = (index: number) => {
      let linkList;
      let status;
      let tag: string;
      if (isPlayerA.value) {
        tag = "A";
        linkList = [...routeA.value];
      } else if (isPlayerB.value) {
        tag = "B";
        linkList = [...routeB.value];
      } else {
        tag = "";
        return;
      }
      if (index === linkList[linkList.length - 1]) {
        status = 0;
      } else {
        status = isPlayerA.value ? 1 : 3;
      }
      store.dispatch("update_spell", { idx: index, status }).then(() => {
        link(tag, index);
      });
    };
    const link = (tag: string, index: number) => {
      if (tag !== "A" && tag !== "B") return;
      let list;
      if (tag === "A") {
        list = [...routeA.value];
      } else if (tag === "B") {
        list = [...routeB.value];
      }
      const length = list.length;
      if (length > 1) {
        if (list[length - 1] === index) {
          list.pop();
        } else if (list.indexOf(index) === -1) {
          list.push(index);
        }
      } else {
        list.push(index);
      }
      if (tag === "A") {
        routeA.value = list;
      } else if (tag === "B") {
        routeB.value = list;
      }
      if ((isPlayerA.value && tag === "A") || (isPlayerB.value && tag === "B")) {
        getAvailableIndexList();
      }
    };
    const timeFormat = (time: number | null) => {
      function format(number: number): string {
        return number < 10 ? `0${number}` : "" + number;
      }

      if (!time) {
        return "";
      }
      time = Math.floor(time / 1000);
      let second, hour, minute;
      second = time % 60;
      if (time >= 3600) {
        hour = Math.floor(time / 3600);
        minute = Math.floor(time / 60) % 60;
      } else {
        minute = Math.floor(time / 60);
      }
      return (hour ? format(hour) + "h " : "") + (minute ? format(minute) + "m " : "") + format(second) + "s";
    };
    const decideLink = (value) => {
      if (value.link_data) {
        if (value.link_data.link_idx_a) {
          if (!isPlayerB.value || value.phase !== 1) {
            routeA.value = value.link_data.link_idx_a;
          } else {
            routeA.value = [0];
          }
        }
        if (value.link_data.link_idx_b) {
          if (!isPlayerA.value || value.phase !== 1) {
            routeB.value = value.link_data.link_idx_b;
          } else {
            routeB.value = [4];
          }
        }

        if (value.phase === 2 && value.link_data.start_ms_a) {
          linkStartTime.value = value.link_data.start_ms_a;
          if (!gamePaused.value) {
            nextTick(() => {
              countdownRef.value?.start();
            });
          }
        } else if (value.phase >= 3) {
          spendTimeA.value = value.link_data.end_ms_a - value.link_data.start_ms_a;
          let sum = 0;
          for (let item of routeA.value) {
            sum += value.spells[item].star;
          }
          playerAScore.value = sum;
          if (value.phase === 4) {
            spendTimeB.value = value.link_data.end_ms_b - value.link_data.start_ms_b;
            countdownRef.value?.stop();
            let sum = 0;
            for (let item of routeB.value) {
              sum += value.spells[item].star;
            }
            playerBScore.value = sum;
            layoutRef.value?.showAlert("比赛已结束，等待房主操作", "red");
            confirmed.value = false;
            if (playerAScore.value * 2 + spendTimeScore.value > playerBScore.value * 2) {
              winFlag.value = -1;
            } else {
              winFlag.value = 1;
            }
          } else {
            if (!gamePaused.value && value.link_data.start_ms_b) {
              linkStartTime.value = value.link_data.start_ms_b;
              nextTick(() => {
                countdownRef.value?.start();
              });
            } else {
              countdownRef.value?.stop();
            }
          }
        }

        nextTick(() => {
          nextTick(() => {
            if (routeComplete.value && value.phase > 1) {
              confirmed.value = true;
              availableIndexList.value = [];
            } else {
              getAvailableIndexList();
            }
          });
        });

        delete value.link_data.link_idx_a;
        delete value.link_data.link_idx_b;
      }
    };

    const startGame = () => {
      if (roomSettings.value.gamebp && !inMatch.value) {
        store.dispatch("start_ban_pick", {
          who_first: 0,
        });
      } else {
        store.dispatch("start_game").then(() => {
          store.dispatch("change_card_count", {
            cnt: [roomSettings.value.playerA.changeCardCount, roomSettings.value.playerB.changeCardCount],
          });
          store.commit("change_game_state", true);
          store.dispatch("set_phase", { phase: 1 }).then(() => {
            layoutRef.value?.hideAlert();
            countdownRef.value?.start();
          });
        });
      }
    };
    const drawSpellCard = () => {
      store
        .dispatch("update_room_config", {
          room_config: {
            game_time: roomSettings.value.gameTimeLimit,
            countdown: roomSettings.value.countdownTime,
            cd_time: roomSettings.value.cdTime,
            difficulty: roomSettings.value.difficulty,
            need_win: (roomSettings.value.format + 1) / 2,
            is_private: roomSettings.value.private,
          },
        })
        .then(() => {
          store.dispatch("start_game").then(() => {
            store.dispatch("change_card_count", {
              cnt: [roomSettings.value.playerA.changeCardCount, roomSettings.value.playerB.changeCardCount],
            });
            store.commit("change_game_state", true);
            store.dispatch("set_phase", { phase: 1 }).then(() => {
              layoutRef.value?.hideAlert();
              countdownRef.value?.start();
            });
          });
        });
    };
    const stopGame = () => {
      const checked = ref<boolean | string | number>(-1);
      ElMessageBox({
        title: "还没有人获胜，现在结束比赛请选择一个选项",
        message: () =>
          h(
            ElRadioGroup,
            {
              modelValue: checked.value,
              "onUpdate:modelValue": (val: boolean | string | number) => {
                checked.value = val;
              },
            },
            () => [
              h(
                ElRadio,
                {
                  label: -1,
                },
                {
                  default: () => "结果作废",
                }
              ),
              h(
                ElRadio,
                {
                  label: 0,
                },
                {
                  default: () => roomData.value.names[0] + "获胜",
                }
              ),
              h(
                ElRadio,
                {
                  label: 1,
                },
                {
                  default: () => roomData.value.names[1] + "获胜",
                }
              ),
            ]
          ),
      })
        .then(() => {
          //winner
          if ((checked.value as number) < 0) {
            store.dispatch("stop_game", { winner: -1 }).then(() => {
              store.dispatch("set_phase", { phase: 0 });
              linkStartTime.value = 0;
            });
          } else {
            store.dispatch("stop_game", { winner: checked.value }).then(() => {
              store.dispatch("set_phase", { phase: 0 });
              linkStartTime.value = 0;
            });
          }
        })
        .catch(() => {});
    };
    const pauseGame = () => {
      if (isBingoLink.value) {
        store.dispatch("link_time", { whose: gamePhase.value > 2 ? 1 : 0, event: 2 });
      } else {
        store.dispatch("pause", { pause: true });
      }
    };
    const resumeGame = () => {
      if (isBingoLink.value) {
        store.dispatch("link_time", { whose: gamePhase.value > 2 ? 1 : 0, event: 1 });
      } else {
        store.dispatch("pause", { pause: false });
      }
    };
    const confirmWinner = () => {
      store.dispatch("stop_game", { winner: winFlag.value < 0 ? 0 : 1 }).then(() => {
        store.dispatch("set_phase", { phase: 0 }).then(() => {
          winFlag.value = 0;
          countdownRef.value?.stop();
        });
      });
    };
    const confirmSelect = () => {
      if (isBingoLink.value) {
        if (!confirmed.value) {
          availableIndexList.value = [];
          confirmed.value = true;
        } else {
          getAvailableIndexList();
          confirmed.value = false;
        }
      } else {
        if (isPlayerA.value) {
          store.dispatch("update_spell", { idx: selectedSpellIndex.value, status: 1 }).then(() => {
            selectedSpellIndex.value = -1;
          });
        }
        if (isPlayerB.value) {
          store.dispatch("update_spell", { idx: selectedSpellIndex.value, status: 3 }).then(() => {
            selectedSpellIndex.value = -1;
          });
        }
        const time = GameTime.current;
        attainCooldownStart.value = time;
        Storage.local.set("attainCooldownStart", time);
      }
    };
    const confirmAttained = () => {
      if (isPlayerA.value) {
        store.dispatch("update_spell", { idx: playerASelectedIndex.value, status: 5 });
        store.commit("set_last_get_time", {
          index: 0,
          time: new Date().getTime() + timeMistake.value,
        });
      }
      if (isPlayerB.value) {
        store.dispatch("update_spell", { idx: playerBSelectedIndex.value, status: 7 });
        store.commit("set_last_get_time", {
          index: 1,
          time: new Date().getTime() + timeMistake.value,
        });
      }
    };
    const alterPlayer = (name: string) => {
      store.dispatch("warn_player", {
        name,
      });
    };
    const onCountDownComplete = () => {
      if (isBingoLink.value) {
        if (gamePhase.value === 1) {
          if (routeComplete.value) {
            availableIndexList.value = [];
            confirmed.value = true;
          }
          if (isOwner.value) {
            store.dispatch("set_phase", { phase: 2 }).then(() => {
              store.dispatch("link_time", { whose: 0, event: 1 }).then(() => {
                countdownRef.value?.start();
              });
            });
          }
        }
      } else {
        if (gamePhase.value === 1) {
          if (isOwner.value) {
            store.dispatch("set_phase", { phase: 2 }).then(() => {
              countdownRef.value?.start();
            });
          } else {
            store.dispatch("get_spells");
          }
        } else if (gamePhase.value === 2) {
          if (isOwner.value) {
            let countA = 0;
            let countB = 0;
            for (let item of gameData.value.status) {
              if (item === 5) {
                countA += item;
              } else if (item === 7) {
                countB += item;
              }
            }
            if (countA !== countB) {
              store.dispatch("set_phase", { phase: 0 });
            }
          }
        }
      }
    };
    const resetRoom = () => {
      ElMessageBox.confirm("该操作会把房间回复到初始状态，是否确认？", "警告", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          store.dispatch("reset_room");
        })
        .catch(() => {});
    };
    const addChangeCardCount = (index: number) => {
      const arr = [...roomData.value.change_card_count];
      arr[index]++;
      store.dispatch("change_card_count", {
        cnt: arr,
      });
    };
    const removeChangeCardCount = (index: number) => {
      const arr = [...roomData.value.change_card_count];
      arr[index]--;
      store.dispatch("change_card_count", {
        cnt: arr,
      });
    };
    const playerBanPick = () => {
      if (!bpCode.value) {
        ElMessageBox.confirm("你没有选择作品，是否确认不选择？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        })
          .then(() => {
            store.dispatch("ban_pick", {
              selection: "",
            });
          })
          .catch(() => {});
      } else {
        store.dispatch("ban_pick", {
          selection: bpCode.value,
        });
      }
    };
    const confirmOpenEX = (flag: boolean) => {
      if (flag) {
        store.dispatch("ban_pick", {
          selection: "1",
        });
      } else {
        store.dispatch("ban_pick", {
          selection: "-1",
        });
      }
    };

    onMounted(() => {
      cardCount.value = roomData.value.change_card_count;
      if (!inGame.value) {
        layoutRef.value?.showAlert("等待房主开始比赛", "#000");
      } else {
        layoutRef.value?.hideAlert();
      }

      if (isBingoLink.value) {
        Mit.on("A_link_change", (index) => {
          if (isHost.value || isWatcher.value) {
            if (!(gamePhase.value === 2)) {
              link("A", index as number);
            }
          } else if (gamePhase.value > 1) {
            link("A", index as number);
          }
        });
        Mit.on("B_link_change", (index) => {
          if (isHost.value || isWatcher.value) {
            if (!(gamePhase.value === 2)) {
              link("B", index as number);
            }
          } else if (gamePhase.value > 1) {
            link("B", index as number);
          }
        });
        if (!isHost.value) {
          getAvailableIndexList();
        }
      }
    });

    onUnmounted(() => {
      if (isBingoLink.value) {
        Mit.off("A_link_change");
        Mit.off("B_link_change");
      }
    });

    watch(gamePhase, (newVal, oldVal) => {
      if (oldVal === 2 && newVal === 3) {
        Mit.emit("right_link_start");
      }
    });

    watch(gameData, (newVal, oldVal) => {
      if (newVal.start_time) {
        const isStandByPhase = GameTime.main <= 0;
        if (isStandByPhase) {
          nextTick(() => {
            countdownRef.value?.start();
          });
          store.commit("clear_ban_pick_info");
        } else {
          if (isBingoLink.value) {
            if (!newVal.link_data.start_ms_a && newVal.phase !== 2) {
              store.dispatch("set_phase", { phase: 2 }).then(() => {
                store.dispatch("link_time", { whose: 0, event: 1 }).then(() => {
                  countdownRef.value?.start();
                });
              });
            }
          } else {
            if (isHost.value && newVal.phase < 2) {
              store.dispatch("set_phase", { phase: 2 });
            }
            nextTick(() => {
              countdownRef.value?.start();
              if (newVal.pause_begin_ms) {
                countdownRef.value?.pause();
              }
            });
          }
        }
      } else {
        store.commit("change_game_state", false);
        availableIndexList.value = [];
      }

      if (newVal.phase === 2 && oldVal.phase === 1 && !isHost.value) {
        store.dispatch("get_spells");
      }

      const status = newVal.status;
      if (status && status.length) {
        if (isBingoStandard.value) {
          decideStandard(status);
        }
        if (isBingoBp.value) {
          decideBp(status);
        }
      }

      if (isBingoLink.value) {
        winFlag.value = 0;
        if (newVal.link_data) {
          decideLink(newVal);
        }
      }
    });

    watch(roomData, (newVal, oldVal) => {
      if (newVal.winner !== undefined) {
        ElMessageBox.alert(`${roomData.value.names[newVal.winner]}获胜`, "比赛结束", {
          confirmButtonText: "确定",
        });
        delete newVal.winner;
      }
      cardCount.value = newVal.change_card_count;
      if (!newVal.started) {
        if (banPickInfo.value.phase !== 9999) {
          layoutRef.value?.showAlert("等待房主开始比赛", "#000");
        }

        playerAScore.value = 0;
        playerBScore.value = 0;
        if (isBingoLink.value) {
          routeA.value = [];
          routeB.value = [];
          spendTimeA.value = 0;
          spendTimeB.value = 0;
          availableIndexList.value = [];
          confirmed.value = false;
          if (newVal.winner !== undefined) {
            ElMessageBox.alert(`${roomData.value.names[newVal.winner]}获胜`, "比赛结束", {
              confirmButtonText: "确定",
            });
            delete newVal.winner;
          }
          cardCount.value = newVal.change_card_count;
        }
      }
    });

    watch(inGame, (newVal, oldVal) => {
      if (!newVal && !isBpPhase.value) {
        layoutRef.value?.showAlert("等待房主开始比赛", "#000");
      } else {
        layoutRef.value?.hideAlert();
      }
    });

    watch(gamePaused, (newVal, oldVal) => {
      if (newVal) {
        layoutRef.value?.showAlert("游戏已暂停", "#000");
        countdownRef.value?.pause();
      } else {
        layoutRef.value?.hideAlert();
        countdownRef.value?.start();
      }
    });

    watch(isBpPhase, (newVal) => {
      if (newVal) {
        layoutRef.value?.hideAlert();
      }
    });

    return {
      countdownRef,
      layoutRef,
      gameData,
      roomData,
      roomSettings,
      roomConfig,
      banPickInfo,
      userRole,
      isHost,
      isPlayer,
      isWatcher,
      isPlayerA,
      isPlayerB,
      isOwner,
      playerAName,
      playerBName,
      playerACanBP,
      playerBCanBP,
      isBingoStandard,
      isBingoBp,
      isBingoLink,
      soloMode,
      inGame,
      inMatch,
      bpStatus,
      isBpPhase,
      playerASelectedIndex,
      playerBSelectedIndex,
      gamePaused,
      gamePhase,
      timeMistake,
      spellCardSelected,
      selectCooldownStart,
      attainCooldownStart,
      menu,
      selectedSpellIndex,
      winFlag,
      bpCode,
      oldSumArr,
      playerAScore,
      playerBScore,
      cardCount,
      isMyTurn,
      bingoBpPhase,
      routeA,
      routeB,
      spendTimeA,
      spendTimeB,
      linkStartTime,
      availableIndexList,
      routeComplete,
      countdownMode,
      spendTimeScore,
      confirmed,
      startGame,
      drawSpellCard,
      stopGame,
      pauseGame,
      resumeGame,
      confirmWinner,
      confirmSelect,
      confirmAttained,
      alterPlayer,
      onCountDownComplete,
      resetRoom,
      addChangeCardCount,
      removeChangeCardCount,
      playerBanPick,
      confirmOpenEX,
      nextRound,
      confirmBan,
      linkTiming,
      getAvailableIndexList,
      selectSpellCardLink,
      link,
      timeFormat,
    };
  },
});
</script>

<style lang="scss" scoped>
.bingo-effect {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 99;
}

.spell-card-score-text {
  font-size: 12px;
  height: 16px;
}
</style>
