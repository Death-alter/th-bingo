<template>
  <div class="room">
    <el-row>
      <el-col :span="4"></el-col>
      <el-col :span="16">
        <div class="room-title" v-if="roomData.names">
          <div class="player-A">{{ roomData.names[0] }}</div>
          <div class="scoreboard">
            <div class="A-scoreboard" v-if="roomData.names[0]">
              <div :class="{ 'score-circle': true, scored: roomData.score[0] >= 2 }"></div>
              <div :class="{ 'score-circle': true, scored: roomData.score[0] >= 1 }"></div>
            </div>
            <div class="vs-text">VS</div>
            <div class="B-scoreboard" v-if="roomData.names[1]">
              <div :class="{ 'score-circle': true, scored: roomData.score[1] >= 1 }"></div>
              <div :class="{ 'score-circle': true, scored: roomData.score[1] >= 2 }"></div>
            </div>
          </div>
          <div class="player-B">{{ roomData.names[1] }}</div>
        </div>
        <div class="game">
          <standard v-if="gameRule === 'standard'" />
        </div>
      </el-col>
      <el-col :span="4"></el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import { ElRow, ElCol } from "element-plus";
import standard from "./games/standard.vue";

export default defineComponent({
  name: "Room",
  data() {
    return {
      gameRule: "standard",
    };
  },
  components: {
    standard,
    ElRow,
    ElCol,
  },
  setup() {
    const store = useStore();
    if (store.getters.roomData.started) {
      store.dispatch("get_spells");
    }
    return {
      roomData: computed(() => store.getters.roomData),
    };
  },
  methods: {},
});
</script>

<style lang="scss" scoped>
.room-title {
  font-size: 28px;
  margin: 16px 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .player-A {
    text-align: right;
    width: 35%;
  }

  .player-B {
    text-align: left;
    width: 35%;
  }

  .scoreboard {
    width: 30%;
    display: flex;
    justify-content: center;
    align-items: center;

    .vs-text {
      min-width: 80px;
      text-align: center;
    }

    .A-scoreboard,
    .B-scoreboard {
      width: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .score-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #999;
    margin: 0 3px;

    &.scored {
      background-color: red;
    }
  }
}
</style>
