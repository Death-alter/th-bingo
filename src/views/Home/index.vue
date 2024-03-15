<template>
  <div class="home">
    <div class="enter-room relative-center">
      <el-form :model="form" :rules="rules" @submit.prevent ref="formRef">
        <el-form-item prop="roomPassword">
          <div class="room-password">
            <el-input
              v-model="form.roomPassword"
              :rules="rules"
              type="password"
              placeholder="请输入4-16位数房间密码，仅支持数字"
              maxlength="16"
              show-password
            />
          </div>
        </el-form-item>
        <el-form-item prop="soloMode">
          <div class="solo-mode-check-box">
            <el-checkbox v-model="form.soloMode" @change="onChangeSoloMode">无导播模式</el-checkbox>
            <el-checkbox v-model="form.addRobot" :disabled="!form.soloMode">单人练习模式</el-checkbox>
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
import { defineComponent, computed, ref, reactive } from "vue";
import { ElInput, ElButton, ElForm, ElFormItem, ElCheckbox } from "element-plus";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import type { FormInstance } from "element-plus";

export default defineComponent({
  name: "Home",
  components: {
    ElInput,
    ElButton,
    ElForm,
    ElFormItem,
    ElCheckbox,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const formRef = ref<FormInstance>();
    const roomSettings = computed(() => store.getters.roomSettings);
    const userData = computed(() => store.getters.userData);
    const form = reactive({
      roomPassword: "",
      soloMode: false,
      addRobot: false,
    });
    const rules = {
      roomPassword: [
        { required: true, message: "请输入密码", trigger: "blur" },
        {
          min: 4,
          max: 16,
          message: "密码长度应为4-16个数字",
          trigger: "blur",
        },
        {
          validator: (rule: any, value: any, callback: any) => {
            if (/\D/.test(value)) {
              callback(new Error("密码只能使用数字"));
            } else {
              callback();
            }
          },
          trigger: "blur",
        },
      ],
    };

    const createRoom = () => {
      if (!formRef.value) return;
      formRef.value.validate((valid, fields) => {
        if (valid) {
          store
            .dispatch("create_room", {
              name: userData.value.userName,
              rid: form.roomPassword,
              solo: form.soloMode,
              add_robot: form.addRobot,
              room_config: {
                game_time: roomSettings.value.gameTimeLimit,
                countdown: roomSettings.value.countdownTime,
                games: roomSettings.value.checkList,
                ranks: roomSettings.value.rankList,
                need_win: (roomSettings.value.format + 1) / 2,
                difficulty: roomSettings.value.difficulty,
                is_private: roomSettings.value.private,
                cd_time: roomSettings.value.cdTime,
                reserved_type: roomSettings.value.reservedType,
              },
              type: 1,
            })
            .then(() => {
              router.push(`/room/${form.roomPassword}`);
            });
        }
      });
    };
    const joinRoom = () => {
      if (!formRef.value) return;
      formRef.value.validate((valid, fields) => {
        if (valid) {
          store
            .dispatch("join_room", {
              name: userData.value.userName,
              rid: form.roomPassword,
            })
            .then(() => {
              router.push(`/room/${form.roomPassword}`);
            });
        }
      });
    };
    const onChangeSoloMode = (val) => {
      if (!val) {
        form.addRobot = false;
      }
    };

    return {
      formRef,
      userData,
      roomSettings,
      form,
      rules,
      createRoom,
      joinRoom,
      onChangeSoloMode,
    };
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

  .solo-mode-check-box {
    width: 100%;
    text-align: center;
  }

  .btns {
    margin-top: 30px;

    & > * {
      margin: 0 30px;
    }
  }
}
</style>
