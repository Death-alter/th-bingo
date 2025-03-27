<template>
  <div class="right-click-menu-wrap">
    <div ref="innerElement" class="right-click-menu-inner">
      <slot></slot>
    </div>
    <div class="right-click-menu" v-show="showMenu" :style="{ left: left + 'px', top: top + 'px' }">
      <div
        v-for="(item, index) in (menuData as any[])"
        :key="index"
        @mouseup="onMenuItemClick($event, item)"
        @contextmenu="
          (e) => {
            e.preventDefault();
            return false;
          }
        "
        :class="{ 'menu-item': true, playerA: item.tag === 'playerA', playerB: item.tag === 'playerB' }"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";

const innerElement = ref();
const showMenu = ref(false);
const left = ref(0);
const top = ref(0);
const targetElement = ref(null);
const timer = ref(0);

const props = withDefaults(
  defineProps<{
    menuData: any[];
    disabled?: boolean;
  }>(),
  {
    menuData: () => [],
    disabled: false,
  }
);
const emits = defineEmits(["click"]);

const onMenuItemClick = (e: any, item: any) => {
  emits("click", { event: e, target: targetElement.value, item });
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
}

.menu-item {
  font-size: 14px;
  text-align: left;
  line-height: 20px;
  padding: 6px 10px;
  cursor: pointer;

  & + .menu-item {
    border-top: 1px solid #ccc;
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
</style>
