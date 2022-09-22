<template>
  <div class="home">
    <div class="enter-room relative-center">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="roomPassword">
          <div class="room-password">
            <el-input
              v-model="form.roomPassword"
              :rules="rules"
              type="password"
              placeholder="请输入4-16位数房间密码，可以使用大小写字母和数字"
              maxlength="16"
              show-password
            />
          </div>
        </el-form-item>
      </el-form>
      <div class="btns">
        <el-button type="primary" @click="createRoom">创建房间</el-button>
        <el-button type="primary" @click="joinRoom">加入房间</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElInput, ElButton, ElForm, ElFormItem } from "element-plus";
import { ref } from "vue";
import type { FormInstance } from "element-plus";

export default defineComponent({
  name: "Home",
  data() {
    return {
      form: {
        roomPassword: "",
      },
      rules: {
        roomPassword: [
          { required: true, message: "请输入密码", trigger: "blur" },
          {
            min: 4,
            max: 16,
            message: "密码长度应为4-16个字符",
            trigger: "blur",
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              if (/[^a-zA-Z0-9]/.test(value)) {
                callback(new Error("密码只能使用数字和字母"));
              }
            },
            trigger: "blur",
          },
        ],
      },
    };
  },
  components: {
    ElInput,
    ElButton,
    ElForm,
    ElFormItem,
  },
  setup() {
    const formRef = ref<FormInstance>();
    return {
      formRef,
    };
  },
  methods: {
    createRoom() {
      if (!this.formRef) return;
      this.formRef.validate((valid, fields) => {
        if (valid) {
        }
      });
    },
    joinRoom() {
      if (!this.formRef) return;
      this.formRef.validate((valid, fields) => {
        if (valid) {
        }
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.enter-room {
  width: 400px;

  .room-password {
    width: 100%;

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
