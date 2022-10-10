<template>
  <div class="room">
    <el-row>
      <el-col :span="4"></el-col>
      <el-col :span="16">
        <div class="room-title" v-if="roomData.names">
          <div class="player-A">{{ roomData.names[0] }}</div>
          <div class="vs-text">VS</div>
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
    if(store.getters.roomData.started){
      store.dispatch("get_spells")
    }
    return {
      roomData: computed(() => store.getters.roomData),
    };
  },
  methods: {},
});
</script>

<style lang="scss" scoped>
.room {
  .room-title {
    font-size: 28px;
    margin: 16px 0;

    display: flex;
    justify-content: center;
    align-items: center;

    .player-A {
      text-align: right;
      width: 40%;
    }
    .vs-text {
      width: 20%;
      min-width: 80px;
      text-align: center;
    }
    .player-B {
      text-align: left;
      width: 40%;
    }
  }
}
</style>
