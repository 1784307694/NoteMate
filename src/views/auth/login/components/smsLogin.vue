<script setup lang="ts">
import { ref, computed } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { ElMessage } from "element-plus"
import { ArrowRight } from "@element-plus/icons-vue"

import type { LoginForm } from "@/types/auth"
import api from "@/apis"

const formRef = ref<FormInstance>()
const countdown = ref(0)
const timer = ref<number>()
const agreementChecked = ref(false)
const sliderValue = ref(6)
const isSliderVerified = ref(false)
const isDragging = ref(false)
const slideStartTime = ref(0)
const MIN_SLIDE_TIME = 50 // 最小滑动时间（毫秒）

const form = ref<LoginForm>({
  loginType: "sms",
  phone: "",
  code: "",
})

// 表单验证规则
const rules = ref<FormRules>({
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { min: 11, max: 11, message: "请输入11位手机号", trigger: ["blur", "change"] },
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { min: 6, max: 6, message: "请输入6位验证码", trigger: ["blur", "change"] },
    { pattern: /^\d{6}$/, message: "验证码格式不正确", trigger: "blur" },
  ],
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
    // 验证手机号
    await formRef.value.validateField("phone")

    // 开始倒计时
    countdown.value = 60
    timer.value = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer.value)
      }
    }, 1000)

    // TODO: 调用获取验证码接口
  } catch (error) {
    // 验证失败不执行后续操作
  }
}

// 提交表单
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      // TODO: 调用登录接口
      const res = await api.base.login(form.value)
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
</script>

<template>
  <div class="sms-login">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @keyup.enter="handleSubmit(formRef)"
    >
      <el-form-item prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
          maxlength="11"
          @input="form.phone = form.phone?.replace(/[^\d]/g, '') || ''"
        />
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

      <el-form-item>
        <el-button
          type="primary"
          style="width: 100%"
          :disabled="!agreementChecked"
          @click="handleSubmit(formRef)"
        >
          登录/注册
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
.sms-login {
  width: 100%;
  padding: 0 10px;

  :deep(.el-input__wrapper) {
    height: 40px;
    border-radius: 8px;
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
