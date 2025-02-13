<script setup lang="ts">
import { Bell } from "@element-plus/icons-vue"
import { useUserStore } from "@/stores/userInfo"

const userStore = useUserStore()
</script>

<template>
  <div class="aside-header">
    <div class="logo">
      <span>NoteMate</span>
    </div>
    <div class="action-bar">
      <el-badge is-dot class="item">
        <el-button class="icon-btn" size="small">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>
      <el-button class="icon-btn avatar-btn" size="small">
        <el-avatar class="user-avatar" size="small" :src="userStore.avatar" />
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.aside-header {
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .logo {
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;
  }

  .action-bar {
    display: flex;
    align-items: center;
    gap: 8px;

    .icon-btn {
      padding: 4px;
      height: 32px;
      width: 32px;
      border: none;
      background: transparent;
      color: #4e5969;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;

      &:hover {
        background-color: #f2f3f5;
      }

      .el-icon {
        font-size: 16px;
      }

      &.el-button--small {
        &.avatar-btn {
          height: 36px;
          width: 36px;
          padding: 2px;
        }
      }

      .user-avatar {
        width: 28px;
        height: 28px;
      }
    }

    :deep(.el-badge__content.is-dot) {
      border: 2px solid #fafafa;
    }
  }
}
</style>
