<template>
  <div class="article-header">
    <div class="header-left">
      <div class="article-title">
        <span class="title">{{ title }}</span>
        <el-icon v-if="isPaid" class="paid-icon"><Lock /></el-icon>
        <el-icon v-else class="free-icon"><Unlock /></el-icon>
      </div>
    </div>
    <div class="header-right">
      <el-button :icon="Star" circle :type="isCollected ? 'primary' : ''" @click="handleCollect" />
      <el-button :icon="Share" circle @click="handleShare" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, Unlock, Star, Share } from "@element-plus/icons-vue"

defineProps<{
  title: string
  isPaid: boolean
  isCollected: boolean
}>()

// 处理收藏
const handleCollect = () => {
  // TODO: 调用收藏接口
}

// 处理分享
const handleShare = () => {
  // TODO: 实现分享功能
}
</script>

<style lang="less" scoped>
.article-header {
  height: 64px;
  padding: 0 40px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;

  .header-left {
    display: flex;
    align-items: center;

    .article-title {
      display: flex;
      align-items: center;
      gap: 8px;

      .title {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        max-width: 800px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .paid-icon {
        font-size: 16px;
        color: var(--el-color-danger);
      }

      .free-icon {
        font-size: 16px;
        color: var(--el-color-success);
      }
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }

  :deep(.el-button) {
    font-size: 14px;

    &.el-button--primary {
      --el-button-bg-color: var(--el-color-primary);
      --el-button-border-color: var(--el-color-primary);
      --el-button-hover-bg-color: var(--el-color-primary-light-3);
      --el-button-hover-border-color: var(--el-color-primary-light-3);
    }
  }
}
</style>
