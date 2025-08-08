<template>
  <el-button type="primary" v-if="!inGame" @click="startGame">开始比赛</el-button>
  <template v-if="!soloMode">
    <el-button type="primary" v-if="inGame && winFlag === 0" @click="stopGame">结束比赛</el-button>
    <el-button type="primary" v-if="winFlag !== 0" @click="confirmWinner">
      确认：{{ winFlag < 0 ? roomData.names[0] : roomData.names[1] }}获胜
    </el-button>
  </template>
</template>

<script lang="ts" setup>
import { computed, h, ref } from "vue";
import { useGameStore } from "@/store/GameStore";
import { useRoomStore } from "@/store/RoomStore";
import { ElMessageBox, ElRadioGroup, ElRadio, ElButton } from "element-plus";

const props = withDefaults(
  defineProps<{
    winFlag: number;
  }>(),
  {}
);
const emits = defineEmits(["start", "finish"]);

const gameStore = useGameStore();
const roomStore = useRoomStore();
const inGame = computed(() => roomStore.inGame);
const roomData = computed(() => roomStore.roomData);
const roomSettings = computed(() => roomStore.roomSettings);
const inMatch = computed(() => roomStore.inMatch);
const soloMode = computed(() => roomStore.soloMode);

const startGame = () => {
  if (roomSettings.value.gamebp && (!roomSettings.value.matchbp || !inMatch.value)) {
    roomStore.startBanPick();
  } else {
    drawSpellCard();
  }
};
const drawSpellCard = () => {
  gameStore
    .startGame()
    .then(() => {
      roomStore.updateChangeCardCount(roomData.value.names[0], roomSettings.value.playerA.changeCardCount);
      roomStore.updateChangeCardCount(roomData.value.names[1], roomSettings.value.playerB.changeCardCount);
      emits("start");
    })
    .catch((e) => {});
};
const stopGame = () => {
  const checked = ref<1 | 0 | -1>(-1);
  ElMessageBox({
    title: "还没有人获胜，现在结束比赛请选择一个选项",
    message: () =>
      h(
        ElRadioGroup,
        {
          modelValue: checked.value,
          "onUpdate:modelValue": (val: any) => {
            checked.value = val;
          },
        },
        () => [
          h(
            ElRadio,
            {
              value: -1,
            },
            {
              default: () => "结果作废",
            }
          ),
          h(
            ElRadio,
            {
              value: 0,
            },
            {
              default: () => roomData.value.names[0] + "获胜",
            }
          ),
          h(
            ElRadio,
            {
              value: 1,
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
        gameStore.stopGame(-1);
      } else {
        gameStore.stopGame(checked.value);
      }
    })
    .catch(() => {});
};
const confirmWinner = () => {
  gameStore.stopGame(props.winFlag < 0 ? 0 : 1).then(() => {
    emits("finish");
  });
};
</script>

<style lang="scss" scoped>
.bingo-effect {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 99;
}
</style>
