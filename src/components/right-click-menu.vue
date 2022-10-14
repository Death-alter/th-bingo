<template>
  <div class="right-click-menu-wrap">
    <div ref="innerElement" class="right-click-menu-inner">
      <slot></slot>
    </div>
    <div class="right-click-menu" v-show="showMenu" :style="{ left: left + 'px', top: top + 'px' }">
      <div
        v-for="(item, index) in menuData"
        :key="index"
        @click="onMenuItemClick($event, item)"
        @contextmenu="
          (e) => {
            e.preventDefault();
            return false;
          }
        "
        class="menu-item"
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
    };
  },
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
        this.innerElement.addEventListener("mouseup", (e: any) => {
          if (e.button === 2) {
            this.showMenu = true;
            this.left = e.offsetX + e.target.offsetLeft + 10;
            this.top = e.offsetY + e.target.offsetTop;
            this.targetElement = e.target;
          }
          document.addEventListener("click", (e) => {
            this.showMenu = false;
          });
        });
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
}
</style>
