<template>
  <div class="home">
    <div class="enter-room relative-center">
      <div class="room-password">
        <el-input
          v-model="roomPassword"
          type="password"
          placeholder="请输入房间密码，最长16位数"
          maxlength="16"
          show-password
        />
      </div>
      <div class="btns">
        <el-button type="primary">创建房间</el-button>
        <el-button type="primary">加入房间</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElInput, ElButton } from "element-plus";

export default defineComponent({
  name: "Home",
  data() {
    return {
      roomPassword: "",
    };
  },
  components: {
    ElInput,
    ElButton,
  },
});
</script>

<style lang="scss" scoped>
.enter-room {
  width: 400px;

  .room-password {
    :deep(.el-input__inner) {
      font-size: 20px;
      line-height: 20px;
      text-align: center;
    }

    :deep(.el-input__inner::placeholder) {
      font-size: 14px;
      vertical-align: text-top;
      transform: translate(0, -2px);
    }
  }

  .btns {
    margin-top: 50px;

    & > * {
      margin: 0 30px;
    }
  }
}
</style>
