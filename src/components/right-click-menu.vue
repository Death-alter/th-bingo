<template>
  <div class="right-click-menu-wrap">
    <div ref="innerElementRef" class="right-click-menu-inner">
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
<script lang="ts">
import { defineComponent, ref, watch, onMounted } from "vue";

export default defineComponent({
  name: "RightClickMenu",
  props: {
    menuData: {
      type: Array,
      default: () => [] as any[],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["click"],
  setup(props, context) {
    const innerElementRef = ref();
    const showMenu = ref(false);
    const left = ref(0);
    const top = ref(0);
    const targetElement = ref<HTMLElement>();
    const timer = ref(0);

    const onMenuItemClick = (e: any, item: any) => {
      e.stopPropagation();
      if (!targetElement.value) return;
      context.emit("click", { event: e, target: targetElement.value, item });
      showMenu.value = false;
    };
    const enableRightClick = () => {
      if (innerElementRef.value) {
        innerElementRef.value.oncontextmenu = (e: any) => {
          e.preventDefault();
          return false;
        };
        innerElementRef.value.addEventListener("mouseup", onMouseUp);
        innerElementRef.value.addEventListener("touchstart", onTouchStart);
      }
    };
    const disableRightClick = () => {
      if (innerElementRef.value) {
        innerElementRef.value.oncontextmenu = null;
        innerElementRef.value.removeEventListener("mouseup", onMouseUp);
        innerElementRef.value.removeEventListener("touchstart", onTouchStart);
      }
    };
    const hideMenu = () => {
      showMenu.value = false;
      document.removeEventListener("click", hideMenu);
    };
    const onMouseUp = (e: any) => {
      if (e.button === 2) {
        showMenu.value = true;
        left.value = e.offsetX + e.target.offsetLeft + 10;
        top.value = e.offsetY + e.target.offsetTop;
        targetElement.value = e.target;
      }
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
          document.addEventListener("click", hideMenu);
        }, 500);
        const onTouchEnd = () => {
          if (!flag) {
            window.clearInterval(timer.value);
            timer.value = 0;
          }
          innerElementRef.value.removeEventListener("touchend", onTouchEnd);
        };
        innerElementRef.value.addEventListener("touchend", onTouchEnd);
      }
    };

    watch(
      () => props.disabled,
      (val) => {
        if (val) {
          disableRightClick();
        } else {
          enableRightClick();
        }
      },
      {
        immediate: true,
      }
    );

    onMounted(() => {
      if (!props.disabled) {
        enableRightClick();
      }
    });

    return {
      innerElementRef,
      showMenu,
      left,
      top,
      targetElement,
      timer,
      onMenuItemClick,
      enableRightClick,
      disableRightClick,
      hideMenu,
      onMouseUp,
      onTouchStart,
    };
  },
});
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
