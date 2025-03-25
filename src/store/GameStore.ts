import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { useRoomStore } from "./RoomStore";

export const useGameStore = defineStore("game", () => {
  const roomStore = useRoomStore();

  //bigon对局相关
  const phase = ref(1);
  const changeCardCountA = ref(0);
  const changeCardCountB = ref(0);
  const spells = ref([]);
  const spellStatus = ref([]);
  const leftTime = ref(0);
  const gameStatus = ref(0);
  const leftCdTime = ref(0);
  const debugSpellList = ref([]);
  const gameLogs = ref<any[]>([]);
  const banPick = reactive({
    who_first: 1, // 谁是第一个操作的，0-左边，1-右边
    phase: 1, // BP状态
    a_pick: [] as string[], // 左玩家保了哪些作品
    a_ban: [] as string[], // 左玩家ban了哪些作品
    b_pick: [] as string[], // 右玩家保了哪些作品
    b_ban: [] as string[], // 右玩家ban了哪些作品
    a_open_ex: 1, // 左玩家是否选EX难度
    b_open_ex: 1, // 右玩家是否选EX难度
  });

  const inMatch = computed(() => {
    const score = roomStore.roomData.score;
    if (!score) return false;
    const totalScore = score[0] + score[1];
    if (totalScore > 0 || banPick.phase > 0 || !!roomStore.roomData.started) {
      return true;
    } else {
      return false;
    }
  });

  return {
    phase,
    changeCardCountA,
    changeCardCountB,
    spells,
    spellStatus,
    leftTime,
    gameStatus,
    leftCdTime,
    debugSpellList,
    gameLogs,
    inMatch,
  };
});
