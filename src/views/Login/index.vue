<template>
  <div class="login">
    <div class="login-box relative-center">
      <div class="login-box-item">
        <el-input v-model="userName" placeholder="请输入想要使用的名称"></el-input>
      </div>
      <div class="login-box-item">
        <el-button type="primary" class="login-btn" :disabled="!userName" @click="login">登 录</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ElInput, ElButton } from "element-plus";
import { Md5 } from "ts-md5";
import Storage from "@/utils/Storage";

export default defineComponent({
  name: "Login",
  components: { ElInput, ElButton },
  setup() {
    const router = useRouter();
    const store = useStore();
    const userName = ref("");

    const login = () => {
      if (!Storage.local.has("userData")) {
        Storage.local.set("userData", {
          userName: userName.value,
          token: Md5.hashStr(userName.value + new Date().getTime()),
        });
        store.commit("get_user_data");
      }
      router.push("/");
    };

    return {
      userName,
      login,
    };
  },
});
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
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: #ffffffdd;

    .login-box-item {
      display: flex;
      justify-content: center;
      align-items: center;

      :deep(input) {
        text-align: center;
      }

      span {
        white-space: nowrap;
      }

      .login-btn {
        margin-top: 50px;
      }
    }
  }
}
</style>
