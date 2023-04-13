<template>
  <div class="right-click-menu-wrap">
    <div ref="innerElement" class="right-click-menu-inner">
      <slot></slot>
    </div>
    <div class="right-click-menu" v-show="showMenu" :style="{ left: left + 'px', top: top + 'px' }">
      <div
        v-for="(item, index) in menuData"
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
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "RightClickMenu",
  data() {
    return {
      showMenu: false,
      left: 0,
      top: 0,
      targetElement: null,
      timer: 0,
    };
  },
  emits: ["click"],
  setup() {
    const innerElement = ref();
    return { innerElement };
  },
  props: {
    menuData: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    if (!this.disabled) {
      this.enableRightClick();
    }
  },
  watch: {
    disabled: {
      handler(val) {
        if (val) {
          this.disableRightClick();
        } else {
          this.enableRightClick();
        }
      },
      immediate: true,
    },
  },
  methods: {
    onMenuItemClick(e: any, item: any) {
      this.$emit("click", { event: e, target: this.targetElement, item });
      this.showMenu = false;
      e.stopPropagation();
    },
    enableRightClick() {
      if (this.innerElement) {
        this.innerElement.oncontextmenu = (e: any) => {
          e.preventDefault();
          return false;
        };
        this.innerElement.addEventListener("mouseup", this.onMouseUp);
        this.innerElement.addEventListener("touchstart", this.onTouchStart);
      }
    },
    disableRightClick() {
      if (this.innerElement) {
        this.innerElement.oncontextmenu = null;
        this.innerElement.removeEventListener("mouseup", this.onMouseUp);
        this.innerElement.removeEventListener("touchstart", this.onTouchStart);
      }
    },
    onMouseUp(e: any) {
      if (e.button === 2) {
        this.showMenu = true;
        this.left = e.offsetX + e.target.offsetLeft + 10;
        this.top = e.offsetY + e.target.offsetTop;
        this.targetElement = e.target;
      }
      const hideMenu = () => {
        this.showMenu = false;
        document.removeEventListener("click", hideMenu);
      };
      document.addEventListener("click", hideMenu);
    },
    onTouchStart(e: any) {
      if (e.touches.length === 1) {
        let flag = false;
        this.timer = window.setTimeout(() => {
          flag = true;
          this.showMenu = true;
          this.left = e.touches[0].pageX - e.target.offsetParent.getBoundingClientRect().left + 10;
          this.top = e.touches[0].pageY - e.target.offsetParent.getBoundingClientRect().top;
          this.targetElement = e.target;

          const hideMenu = () => {
            this.showMenu = false;
            document.removeEventListener("click", hideMenu);
          };
          document.addEventListener("click", hideMenu);
        }, 500);
        const onTouchEnd = () => {
          if (!flag) {
            window.clearInterval(this.timer);
            this.timer = 0;
          }
          this.innerElement.removeEventListener("touchend", onTouchEnd);
        };
        this.innerElement.addEventListener("touchend", onTouchEnd);
      }
    },
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
