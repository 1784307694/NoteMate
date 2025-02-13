<script setup lang="ts">
import { ref } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { ElMessage } from "element-plus"
import { View, Hide, ArrowRight } from "@element-plus/icons-vue"

import type { LoginForm } from "@/types/auth"

import useTokenStore from "@/stores/token"
import api from "@/apis"
import router from "@/router"
import { lStorage } from "@/utils/storage"

const formRef = ref<FormInstance>()
const agreementChecked = ref(false)
const passwordVisible = ref(false)
const sliderValue = ref(6)
const isSliderVerified = ref(false)
const isDragging = ref(false)
const slideStartTime = ref(0)
const MIN_SLIDE_TIME = 50 // 最小滑动时间（毫秒）

const form = ref<LoginForm>({
  loginType: "email",
  email: "",
  password: "",
})

// 表单验证规则
const rules = ref<FormRules>({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: ["blur", "change"] },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码不能少于6个字符", trigger: ["blur", "change"] },
  ],
})

// 提交表单
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  if (!isSliderVerified.value) {
    ElMessage.warning("请先完成滑块验证")
    return
  }
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = (await api.base.login(form.value)) as any
        if (res.code === 200) {
          ElMessage.success("登录成功")
          lStorage.set("ACCESS_TOKEN", res.data.access_token)
          useTokenStore().setToken(res.data.access_token)
          await router.replace("/")
        }
      } catch (error) {
        ElMessage.error("登录失败")
      }
    }
  })
}

// 切换密码显示状态
const togglePasswordVisible = () => {
  passwordVisible.value = !passwordVisible.value
}

const handleSliderChange = (e: Event) => {
  const value = parseInt((e.target as HTMLInputElement).value)
  requestAnimationFrame(() => {
    sliderValue.value = value
    if (value < 94) {
      isDragging.value = true
    } else {
      const slideTime = Date.now() - slideStartTime.value
      if (slideTime >= MIN_SLIDE_TIME) {
        isSliderVerified.value = true
        isDragging.value = false
      } else {
        // 滑动时间太短，重置
        sliderValue.value = 6
        isDragging.value = false
        ElMessage.warning("请不要操作太快")
      }
    }
  })
}

const handleSliderStart = () => {
  slideStartTime.value = Date.now()
  isDragging.value = true
}

const handleSliderEnd = () => {
  if (isDragging.value && sliderValue.value < 94) {
    sliderValue.value = 6
    isDragging.value = false
  }
}
</script>

<template>
  <div class="email-login">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @keyup.enter="handleSubmit(formRef)"
    >
      <el-form-item prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>

      <el-form-item>
        <div class="custom-slider">
          <div class="el-slider">
            <div class="el-slider__runway" :class="{ 'is-disabled': isSliderVerified }">
              <div
                class="el-slider__bar"
                :style="{
                  width: sliderValue + '%',
                  backgroundColor: isSliderVerified
                    ? 'rgba(149, 212, 117, 0.2)'
                    : 'rgba(230, 230, 230, 0.6)',
                }"
              ></div>
              <div class="el-slider__button-wrapper" :style="{ left: sliderValue + '%' }">
                <div class="el-slider__button">
                  <el-icon :style="{ color: isSliderVerified ? '#95d475' : '#999' }">
                    <ArrowRight />
                  </el-icon>
                </div>
              </div>
              <div class="slider-text">
                {{ isSliderVerified ? "验证通过" : "按住滑块，拖动到最右边" }}
              </div>
            </div>
            <input
              type="range"
              :value="sliderValue"
              @input="handleSliderChange"
              @mousedown="handleSliderStart"
              @touchstart="handleSliderStart"
              @mouseup="handleSliderEnd"
              @touchend="handleSliderEnd"
              min="6"
              max="94"
              class="slider-input"
              :disabled="isSliderVerified"
            />
          </div>
        </div>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          :type="passwordVisible ? 'text' : 'password'"
          placeholder="请输入密码"
        >
          <template #suffix>
            <el-icon class="password-eye" @click="togglePasswordVisible">
              <View v-if="passwordVisible" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item>
        <div class="login-options">
          <router-link class="forgot-password" to="/resetPassword">忘记密码？</router-link>
          <router-link class="register-link" to="/register">没有账号？</router-link>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :disabled="!agreementChecked"
          style="width: 100%"
          @click="handleSubmit(formRef)"
        >
          登录
        </el-button>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="agreementChecked">
          我已阅读并同意
          <router-link class="agreement-link" to="/agreement">服务协议</router-link>
          和
          <router-link class="agreement-link" to="/privacy">隐私权政策</router-link>
        </el-checkbox>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="less" scoped>
.email-login {
  width: 100%;
  padding: 0 10px;

  :deep(.el-input__wrapper) {
    height: 40px;
    border-radius: 8px;
  }

  .password-eye {
    cursor: pointer;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-text-color-primary);
    }
  }

  .login-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -10px;
    width: 100%;

    .forgot-password,
    .register-link {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      text-decoration: none;
      flex-shrink: 0;

      &:hover {
        color: var(--el-color-primary);
      }
    }

    .forgot-password {
      margin-right: auto;
    }

    .register-link {
      margin-left: auto;
    }
  }

  :deep(.el-button--primary) {
    border-radius: 8px;
    height: 40px;
  }

  :deep(.el-form-item__label) {
    padding: 0;
  }

  :deep(.el-input-group__prepend) {
    padding: 0;
  }

  :deep(.el-checkbox__label) {
    color: #606266;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .agreement-link {
    color: var(--el-color-primary);
    text-decoration: none;
    font-size: 14px;
    margin: 0 2px;

    &:hover {
      opacity: 0.8;
    }
  }

  .custom-slider {
    padding: 0;
    width: 100%;
  }

  .el-slider {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    position: relative;

    .slider-input {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 2;
    }

    .slider-text {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #999;
      pointer-events: none;
      user-select: none;
    }

    .el-slider__runway {
      flex: 1;
      height: 40px;
      background-color: rgba(240, 240, 240, 0.6);
      border-radius: 8px;
      position: relative;
      cursor: pointer;

      &.is-disabled {
        cursor: default;

        .el-slider__bar {
          background-color: rgba(149, 212, 117, 0.2);
        }

        .slider-text {
          color: #67c23a;
          font-weight: 500;
        }

        .el-slider__button {
          cursor: default;

          &:hover {
            transform: none;
          }
        }
      }
    }

    .el-slider__bar {
      height: 40px;
      background-color: rgba(230, 230, 230, 0.6);
      border-radius: 8px;
      position: absolute;
      left: 0;
      top: 0;
      transition: all 0.3s ease-out;
      will-change: width;
    }

    .el-slider__button-wrapper {
      height: 40px;
      width: 40px;
      position: absolute;
      z-index: 1;
      top: 0;
      transform: translateX(-50%);
      text-align: center;
      line-height: normal;
      transition: all 0.3s ease-out;
      will-change: transform, left;
      left: clamp(4%, var(--slider-left, 0%), 92%);

      .el-slider__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background-color: #fff;
        border-radius: 4px;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.1);
        transition: all 0.1s ease-out;
        will-change: transform;
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;

        &:hover {
          transform: scale(1.02);
        }

        .el-icon {
          font-size: 20px;
          color: #999;
        }
      }

      &:active {
        .el-slider__button {
          cursor: grabbing;
          transition: none;
        }
      }
    }
  }
}
</style>
