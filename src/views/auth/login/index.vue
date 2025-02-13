<script setup lang="ts">
import { ref } from "vue"
import { Key, Iphone } from "@element-plus/icons-vue"
import SmsLogin from "./components/smsLogin.vue"
import EmailLogin from "./components/emailLogin.vue"

const loginType = ref("sms") // 'sms' | 'email'
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <el-card shadow="always">
        <template #header>
          <div class="card-header">
            <span>NoteMate</span>
          </div>
        </template>

        <div class="card-body">
          <SmsLogin v-show="loginType === 'sms'" />
          <EmailLogin v-show="loginType === 'email'" />
        </div>

        <template #footer>
          <div class="card-footer">
            <div class="divider">
              <span>其他登录方式</span>
            </div>
            <div class="login-switch">
              <!-- 切换登录方式 -->
              <el-button
                class="switch-btn"
                @click="loginType = loginType === 'sms' ? 'email' : 'sms'"
              >
                <el-icon style="font-size: 16px">
                  <component :is="loginType === 'sms' ? Key : Iphone" />
                </el-icon>
                <span style="font-size: 12px; font-weight: 600">{{
                  loginType === "sms" ? "密码登录" : "手机登录"
                }}</span>
              </el-button>
            </div>
          </div>
        </template>
      </el-card>
    </div>
  </div>
</template>

<style lang="less" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.el-card {
  width: 350px;
  height: 550px;
  padding: 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    margin-top: 10px;
    font-size: 24px;
    font-weight: 600;
  }

  .card-body {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
  }

  .card-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: auto;
    padding: 20px 0;

    .divider {
      width: 100%;
      display: flex;
      align-items: center;
      color: #262626;
      font-size: 14px;
      margin-bottom: 15px;

      &::before,
      &::after {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(
          to right,
          rgba(238, 238, 238, 0) 0%,
          rgba(238, 238, 238, 1) 50%
        );
      }

      &::after {
        background: linear-gradient(to left, rgba(238, 238, 238, 0) 0%, rgba(238, 238, 238, 1) 50%);
      }

      span {
        padding: 0 12px;
      }
    }

    .login-switch {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;

      .switch-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 32px;
        padding: 0 16px;
        border: 1px solid #dcdfe6;
        border-radius: 16px;
        background-color: #fff;
        color: #606266;
        font-size: 14px;

        &:hover {
          color: var(--el-color-primary);
          border-color: var(--el-color-primary);
        }

        .el-icon {
          font-size: 16px;
        }
      }
    }
  }

  :deep(.el-card__header) {
    border-bottom: none;
    padding: 0;
  }

  :deep(.el-card__footer) {
    border-top: none;
    padding: 0;
  }
}
</style>
