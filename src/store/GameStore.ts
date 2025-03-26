import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { useRoomStore } from "./RoomStore";
import { BpStatus, GameData, GameStatus, Spell, SpellStatus } from "@/types";
import ws from "@/utils/webSocket/WebSocketBingo";
import { WebSocketActionType, WebSocketPushActionType } from "@/utils/webSocket/types";

export const useGameStore = defineStore("game", () => {
  const roomStore = useRoomStore();

  //bigon对局相关
  const phase = ref(1);
  const changeCardCountA = ref(0);
  const changeCardCountB = ref(0);
  const spells = ref<Spell[]>([]);
  const spellStatus = ref<SpellStatus[]>([]);
  const leftTime = ref(0);
  const countDownTime = ref(0);
  const gameStatus = ref(0);
  const leftCdTime = ref(0);
  const debugSpellList = ref([]);
  const gameLogs = ref<any[]>([]);

  const playerASelectedIndex = computed(() => spellStatus.value.indexOf(SpellStatus.A_SELECTED));
  const playerBSelectedIndex = computed(() => spellStatus.value.indexOf(SpellStatus.B_SELECTED));
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

  //赛前bp
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

  const bpStatus = computed(() => {
    if (!banPick.phase) return null;
    switch (banPick.phase) {
      case 1:
      case 3:
        return BpStatus.IS_A_PICK;
      case 2:
      case 4:
        return BpStatus.IS_B_PICK;
      case 5:
      case 8:
      case 9:
        return BpStatus.IS_A_BAN;
      case 6:
      case 7:
      case 10:
        return BpStatus.IS_B_BAN;
      case 11:
        return BpStatus.SELECT_OPEN_EX;
      case 9999:
        return BpStatus.BP_FINISH;
      default:
        return null;
    }
  });

  const bpGameData = reactive({
    whose_turn: 1, // 轮到谁了，0-左边，1-右边
    ban_pick: 1, // 0-选，1-ban，2-轮到收卡了
    spell_failed_count_a: [1, 2, 3], // 左边玩家25张符卡的失败次数
    spell_failed_count_b: [1, 2, 3], // 右边玩家25张符卡的失败次数
  });

  const linkGameData = reactive({});

  const getGameData = () => {
    return ws.send(WebSocketActionType.GET_ALL_SPELLS).then((data: GameData) => {
      spells.value = data.spells;
      spellStatus.value = data.spell_status;
      leftTime.value = data.left_time;
      gameStatus.value = data.status;
      leftCdTime.value = data.left_cd_time;
      for (const i in data.bp_data) {
        bpGameData[i] = data.bp_data[i];
      }
    });
  };

  const startGame = () => {};

  ws.on(WebSocketPushActionType.PUSH_START_GAME, (roomConfig) => {});

  return {
    phase,
    changeCardCountA,
    changeCardCountB,
    spells,
    spellStatus,
    leftTime,
    countDownTime,
    gameStatus,
    leftCdTime,
    debugSpellList,
    gameLogs,
    banPick,
    playerASelectedIndex,
    playerBSelectedIndex,
    inMatch,
    bpStatus,
    getGameData,
  };
});
