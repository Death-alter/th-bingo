<template>
  <div class="right-click-menu-wrap">
    <div ref="innerElement" class="right-click-menu-inner">
      <slot></slot>
    </div>
    <div class="right-click-menu" v-show="showMenu" :style="{ left: left + 'px', top: top + 'px' }">
      <table class="menu-inner">
        <tr style="border-bottom: 1px solid #000" v-if="!soloMode">
          <th class="menu-title">{{ roomData.names[0] }}</th>
          <th class="menu-title" style="border-left: 1px solid #000">{{ roomData.names[1] }}</th>
        </tr>
        <tr v-for="(item, index) in validOperations" :key="index" @contextmenu="onContextmenu" class="menu-line">
          <template v-if="soloMode">
            <td
              :class="{ 'menu-item': true, playerA: isPlayerA, playerB: isPlayerB }"
              @click="onMenuItemClick($event, item, isPlayerA ? 0 : 1)"
            >
              {{ getOperationText(item) }}
            </td></template
          >
          <template v-else>
            <td
              class="menu-item"
              v-if="item === MenuOperationType.ATTAINED_FAIL || item === MenuOperationType.BAN"
              :colspan="2"
              @click="onMenuItemClick($event, item)"
            >
              {{ getOperationText(item) }}
            </td>
            <template v-else>
              <td class="playerA menu-item" @click="onMenuItemClick($event, item, 0)">{{ getOperationText(item) }}</td>
              <td class="playerB menu-item" @click="onMenuItemClick($event, item, 1)">{{ getOperationText(item) }}</td>
            </template>
          </template>
        </tr>
      </table>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { BingoType, MenuOperationType, SpellStatus } from "@/types";
import { ref, onMounted, watch, computed } from "vue";
import { useRoomStore } from "@/store/RoomStore";
import { useGameStore } from "@/store/GameStore";
import { ElMessage } from "element-plus";

const roomStore = useRoomStore();
const gameStore = useGameStore();
const innerElement = ref();
const showMenu = ref(false);
const left = ref(0);
const top = ref(0);
const targetElement = ref<HTMLElement>();
const timer = ref(0);

const props = withDefaults(
  defineProps<{
    validOperations: MenuOperationType[];
    disabled?: boolean;
  }>(),
  {
    validOperations: () => [],
    disabled: false,
  }
);
const emits = defineEmits(["click"]);

const soloMode = computed(() => roomStore.soloMode);
const roomData = computed(() => roomStore.roomData);
const isPlayerA = computed(() => roomStore.isPlayerA);
const isPlayerB = computed(() => roomStore.isPlayerB);

const onMenuItemClick = (e: any, type: MenuOperationType, playerIndex: 0 | 1 | undefined = undefined) => {
  const index = targetElement.value?.getAttribute("index") as string;
  const status = gameStore.spellStatus[index];
  const page = gameStore.page.toString();
  if (roomStore.roomData.type === BingoType.DUAL_PAGE && playerIndex !== undefined) {
    const playerPage = gameStore.dualPageGameData.player_current_page[playerIndex].toString();
    if (status[playerIndex * 2 + 1] === SpellStatus.NONE && type === MenuOperationType.SELECT && playerPage !== page) {
      ElMessage.warning("该选手不在当前盘面，不能选择符卡");
      return;
    }
    if (status[playerIndex * 2 + 1] !== SpellStatus.NONE && status[playerIndex * 2] !== page) {
      ElMessage.warning("该符卡不在当前盘面，请切换盘面后操作");
      return;
    }
  }
  if (index !== null) {
    let s;
    switch (type) {
      case MenuOperationType.ATTAINED_FAIL:
        gameStore.finishSpell(parseInt(index), false, playerIndex).catch((e) => {});
        break;
      case MenuOperationType.SET_NONE:
        if (status[1] === SpellStatus.BANNED) {
          s = "0000";
        } else {
          if (playerIndex === 0) {
            if (status[1] === SpellStatus.NONE) return;
            s = `${gameStore.page}${SpellStatus.NONE}${status[2]}${status[3]}`;
          } else {
            if (status[3] === SpellStatus.NONE) return;
            s = `${status[0]}${status[1]}${gameStore.page}${SpellStatus.NONE}`;
          }
        }
        gameStore.updateSpellStatus(parseInt(index), parseInt(s)).catch((e) => {});
        break;
      case MenuOperationType.SELECT:
        if (playerIndex === 0) {
          if (status[1] === SpellStatus.SELECTED) return;
          s = `${gameStore.page}${SpellStatus.SELECTED}${status[2]}${
            status[3] === SpellStatus.SELECTED ? status[3] : SpellStatus.NONE
          }`;
        } else {
          if (status[3] === SpellStatus.SELECTED) return;
          s = `${status[0]}${status[1] === SpellStatus.SELECTED ? status[1] : SpellStatus.NONE}${gameStore.page}${
            SpellStatus.SELECTED
          }`;
        }
        gameStore.updateSpellStatus(parseInt(index), parseInt(s)).catch((e) => {});
        break;
      case MenuOperationType.ATTAIN:
        if (playerIndex === 0) {
          if (status[1] === SpellStatus.ATTAINED) return;
          s = `${gameStore.page}${SpellStatus.ATTAINED}${status[2]}${SpellStatus.NONE}`;
        } else {
          if (status[3] === SpellStatus.ATTAINED) return;
          s = `${status[0]}${SpellStatus.NONE}${gameStore.page}${SpellStatus.ATTAINED}`;
        }
        gameStore.updateSpellStatus(parseInt(index), parseInt(s)).catch((e) => {});
        break;
      case MenuOperationType.BAN:
        gameStore
          .updateSpellStatus(
            parseInt(index),
            parseInt(`${gameStore.page}${SpellStatus.BANNED}${gameStore.page}${SpellStatus.BANNED}`)
          )
          .catch((e) => {});
        break;
    }
  }
  showMenu.value = false;
  e.stopPropagation();
};
const enableRightClick = () => {
  if (innerElement.value) {
    innerElement.value.oncontextmenu = (e: any) => {
      e.preventDefault();
      return false;
    };
    innerElement.value.addEventListener("mouseup", onMouseUp);
    innerElement.value.addEventListener("touchstart", onTouchStart);
  }
};
const disableRightClick = () => {
  if (innerElement.value) {
    innerElement.value.oncontextmenu = null;
    innerElement.value.removeEventListener("mouseup", onMouseUp);
    innerElement.value.removeEventListener("touchstart", onTouchStart);
  }
};
const onMouseUp = (e: any) => {
  console.log(gameStore.spellStatus[e.target.getAttribute("index")]);
  if (e.button === 2) {
    showMenu.value = true;
    left.value = e.offsetX + e.target.offsetLeft + 10;
    top.value = e.offsetY + e.target.offsetTop;
    targetElement.value = e.target;
  }
  const hideMenu = () => {
    showMenu.value = false;
    document.removeEventListener("click", hideMenu);
  };
  document.addEventListener("click", hideMenu);
};
const onTouchStart = (e: any) => {
  if (e.touches.length === 1) {
    let flag = false;
    timer.value = window.setTimeout(() => {
      flag = true;
      showMenu.value = true;
      left.value = e.touches[0].pageX - e.target.offsetParent.getBoundingClientRect().left + 10;
      top.value = e.touches[0].pageY - e.target.offsetParent.getBoundingClientRect().top;
      targetElement.value = e.target;

      const hideMenu = () => {
        showMenu.value = false;
        document.removeEventListener("click", hideMenu);
      };
      document.addEventListener("click", hideMenu);
    }, 500);
    const onTouchEnd = () => {
      if (!flag) {
        window.clearInterval(timer.value);
        timer.value = 0;
      }
      innerElement.value.removeEventListener("touchend", onTouchEnd);
    };
    innerElement.value.addEventListener("touchend", onTouchEnd);
  }
};
const getOperationText = (type: MenuOperationType) => {
  switch (type) {
    case MenuOperationType.ATTAINED_FAIL:
      return "收取失败";
    case MenuOperationType.SET_NONE:
      return "置空";
    case MenuOperationType.SELECT:
      return "选择符卡";
    case MenuOperationType.ATTAIN:
      return "收取符卡";
    case MenuOperationType.BAN:
      return "禁用";
  }
};
const onContextmenu = (e) => {
  e.preventDefault();
  return false;
};

onMounted(() => {
  if (!props.disabled) {
    enableRightClick();
  }
});

watch(
  () => props.disabled,
  (val) => {
    if (val) {
      disableRightClick();
    } else {
      enableRightClick();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.right-click-menu-wrap {
  position: relative;
}

.right-click-menu-inner {
  width: 100%;
  height: 100%;
}

.right-click-menu {
  position: absolute;
  background-color: white;
  z-index: 999;
  border-radius: 4px;
  min-width: 120px;
  box-shadow: 0 0 8px 4px #ccc;
}

.menu-inner {
  border-collapse: collapse;
  user-select: none;
  width: 100%;
}

.menu-title {
  font-size: 14px;
  text-align: center;
  line-height: 20px;
  padding: 6px 10px;
  white-space: nowrap;
}

.menu-line {
  & + .menu-line {
    border-top: 1px solid #ccc;
  }

  .menu-item {
    font-size: 14px;
    text-align: center;
    line-height: 20px;
    padding: 6px 10px;
    white-space: nowrap;
    cursor: pointer;

    &:nth-of-type(2) {
      border-left: 1px solid #ccc;
    }

    &:hover {
      background-color: rgb(218, 238, 255);
    }

    &.playerA {
      color: var(--A-color);
    }

    &.playerB {
      color: var(--B-color);
    }
  }
}
</style>
