<template>
  <div class="rule-standard">
    <div class="bingo-wrap">
      <div class="bingo-items">
        <spell-card-cell
          v-for="(item, index) in spellCardList"
          :key="index"
          :name="item.name"
          :level="item.level"
        ></spell-card-cell>
      </div>
      <bingo-effect class="bingo-effect" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SpellCardCell from "@/components/spell-card-cell.vue";
import BingoEffect from "@/components/bingo-effect/index.vue";

export default defineComponent({
  name: "Room",
  data() {
    return {
      spellCardList: [
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 2,
          name: "火符「火神之光辉」 ",
        },
        {
          level: 3,
          name: "「红色的幻想乡」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 3,
          name: "采掘「妖怪们的盾构法」（即发狂）  ",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
        {
          level: 1,
          name: "月符「月光」",
        },
      ],
      paused: true,
      seconds: 10,
    };
  },
  components: {
    SpellCardCell,
    BingoEffect,
  },
  mounted() {
    if (this.spellCardList.length > 25) {
      this.spellCardList = this.spellCardList.slice(0, 25);
    }
  },
  methods: {},
});
</script>

<style lang="scss" scoped>
.rule-standard {
  width: 100%;
  height: 560px;
  box-sizing: border-box;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
}

.bingo-wrap {
  width: 100%;
  height: 100%;
  position: relative;

  .bingo-items {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    & > * {
      border-left: 1px solid #000;
      border-top: 1px solid #000;
    }
  }
}

.bingo-effect {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 99;
}
</style>
