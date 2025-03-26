<template>
  <div class="login">
    <div class="login-box relative-center">
      <div class="login-box-item">
        <el-input v-model="localStore.username" placeholder="请输入想要使用的名称" @change="onchange"></el-input>
      </div>
      <div class="login-box-item">
        <el-input v-model="localStore.password" placeholder="请输入密码" type="password" show-password></el-input>
      </div>
      <div class="login-box-item">
        <el-button type="primary" class="login-btn" :disabled="!localStore.username" @click="login">登 录</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElInput, ElButton } from "element-plus";
import { useLocalStore } from "@/store/LocalStore";
import { useRoomStore } from "@/store/RoomStore";
import { useRouter } from "vue-router";
import { nextTick } from "vue";

const localStore = useLocalStore();
const roomStore = useRoomStore();
const router = useRouter();

const login = () => {
  localStore.login().then((res: { rid: string | null }) => {
    res && res.rid && (roomStore.roomId = res.rid);
    router.push("/");
  });
};

const onchange = () => {
  nextTick(() => {
    console.log(localStore.username, localStore.password);
  });
};
</script>

<style lang="scss" scoped>
.login {
  width: 100%;
  height: 100%;

  .login-box {
    width: 400px;
    height: 200px;
    border-radius: 5px;
    box-shadow: #00000044 0 0 5px 5px;
    box-sizing: border-box;
    padding: 40px 20px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: #ffffffdd;

    .login-box-item {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 15px;

      :deep(input) {
        text-align: center;
      }

      span {
        white-space: nowrap;
      }

      .login-btn {
        margin-top: 20px;
      }
    }
  }
}
</style>
