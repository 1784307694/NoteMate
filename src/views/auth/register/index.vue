<script setup lang="ts">
import { ref, computed } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { ElMessage } from "element-plus"
import { View, Hide, ArrowRight } from "@element-plus/icons-vue"

import api from "@/apis"
import type { RegisterForm } from "@/types/auth"
import router from "@/router"

const formRef = ref<FormInstance>()
const countdown = ref(0)
const timer = ref<number>()
const agreementChecked = ref(false)
const sliderValue = ref(6)

const isSliderVerified = ref(false)
const isDragging = ref(false)
const slideStartTime = ref(0)
const MIN_SLIDE_TIME = 50 // 最小滑动时间（毫秒）
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)

const form = ref<RegisterForm>({
  username: "",
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
})

// 表单验证规则
const validatePass = (rule: any, value: string, callback: Function) => {
  if (value === "") {
    callback(new Error("请输入密码"))
  } else {
    if (form.value.confirmPassword !== "") {
      formRef.value?.validateField("confirmPassword", () => {})
    }
    callback()
  }
}

const validatePass2 = (rule: any, value: string, callback: Function) => {
  if (value === "") {
    callback(new Error("请再次输入密码"))
  } else if (value !== form.value.password) {
    callback(new Error("两次输入密码不一致"))
  } else {
    callback()
  }
}

const rules = ref<FormRules>({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: ["blur", "change"] },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: ["blur", "change"] },
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { min: 6, max: 6, message: "请输入6位验证码", trigger: ["blur", "change"] },
    { pattern: /^\d{6}$/, message: "验证码格式不正确", trigger: "blur" },
  ],
  password: [
    { required: true, validator: validatePass, trigger: "blur" },
    { min: 6, message: "密码不能少于6个字符", trigger: ["blur", "change"] },
  ],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: "blur" }],
})

// 获取验证码按钮文本
const codeButtonText = computed(() => {
  return countdown.value > 0 ? `${countdown.value}秒后重试` : "获取验证码"
})

// 获取验证码
const getVerifyCode = async () => {
  if (!formRef.value) return
  if (!isSliderVerified.value) {
    ElMessage.warning("请先完成滑块验证")
    return
  }
  try {
    // 验证邮箱
    await formRef.value.validateField("email")

    // 开始倒计时
    countdown.value = 60
    timer.value = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer.value)
      }
    }, 1000)
    // TODO: 调用获取验证码接口
    const res = (await api.base.sendEmailCode(form.value.email)) as any
    if (res.code === 200) {
      ElMessage.success("验证码发送成功")
    } else {
      ElMessage.error(res.msg || "验证码发送失败")
    }
  } catch (error: any) {
    // 验证失败不执行后续操作
    ElMessage.error(error.response?.data?.msg || "验证码发送失败")
  }
}

// 提交表单
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  if (!isSliderVerified.value) {
    ElMessage.warning("请先完成滑块验证")
    return
  }
  await formEl.validate(async (valid) => {
    if (valid) {
      // TODO: 调用注册接口
      console.log("submit form", form.value)
      const res = (await api.base.createUser(form.value)) as any

      if (res.code === 200) {
        ElMessage.success("注册成功")
        router.push("/login")
      } else {
        ElMessage.error(res.msg || "注册失败")
      }
    }
  })
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

// 切换密码显示状态
const togglePasswordVisible = () => {
  passwordVisible.value = !passwordVisible.value
}

const toggleConfirmPasswordVisible = () => {
  confirmPasswordVisible.value = !confirmPasswordVisible.value
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <el-card shadow="always">
        <template #header>
          <div class="card-header">
            <span>注册</span>
          </div>
        </template>

        <div class="card-body">
          <div class="register">
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-position="top"
              @keyup.enter="handleSubmit(formRef)"
            >
              <el-form-item prop="username">
                <el-input v-model="form.username" placeholder="请输入用户名" />
              </el-form-item>

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

              <el-form-item prop="code">
                <div class="verify-code">
                  <el-input
                    v-model="form.code"
                    placeholder="请输入验证码"
                    maxlength="6"
                    @input="form.code = form.code?.replace(/[^\d]/g, '') || ''"
                  />
                  <el-button plain :disabled="countdown > 0" @click="getVerifyCode">
                    {{ codeButtonText }}
                  </el-button>
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

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  :type="confirmPasswordVisible ? 'text' : 'password'"
                  placeholder="请再次输入密码"
                >
                  <template #suffix>
                    <el-icon class="password-eye" @click="toggleConfirmPasswordVisible">
                      <View v-if="confirmPasswordVisible" />
                      <Hide v-else />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  style="width: 100%"
                  :disabled="!agreementChecked"
                  @click="handleSubmit(formRef)"
                >
                  注册
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

              <el-form-item>
                <div class="login-link">
                  已有账号？
                  <router-link to="/login">去登录</router-link>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="less" scoped>
.register-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.register-card {
  .el-card {
    width: 350px;
    min-height: 550px;
    padding: 20px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      margin-top: 10px;
      font-size: 24px;
      font-weight: 600;
    }

    .card-body {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 20px 0;
    }

    :deep(.el-card__header) {
      border-bottom: none;
      padding: 0;
    }
  }
}

.register {
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

  .verify-code {
    display: flex;
    gap: 10px;

    .el-input {
      flex: 1;
    }

    .el-button {
      width: 120px;
      height: 40px;
      border-color: #dcdfe6;
      color: #606266;
      border-radius: 8px;

      &:not(:disabled):hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary);
      }

      &:disabled {
        color: #999;
        border-color: #dcdfe6;
        background-color: #fff;
      }
    }
  }

  .login-link {
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    a {
      color: var(--el-color-primary);
      text-decoration: none;
      margin-left: 4px;

      &:hover {
        opacity: 0.8;
      }
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
