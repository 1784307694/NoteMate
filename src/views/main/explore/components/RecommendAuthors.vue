<script setup lang="ts">
import { ref, onMounted } from "vue"

interface Author {
  id: number
  name: string
  avatar: string
  description: string
  articleCount: number
}

const authorList = ref<Author[]>([])

const loadAuthors = () => {
  // 模拟加载推荐作者数据
  authorList.value = Array(5)
    .fill(null)
    .map((_, index) => ({
      id: index,
      name: `推荐作者 ${index + 1}`,
      avatar: "https://placeholder.co/40x40",
      description: "这是作者的个人简介",
      articleCount: Math.floor(Math.random() * 100),
    }))
}

const handleRefresh = () => {
  loadAuthors()
}

onMounted(() => {
  loadAuthors()
})
</script>

<template>
  <div class="recommend-authors">
    <div class="card-header">
      <span class="title">推荐作者</span>
      <el-button link type="primary" class="refresh-btn" @click="handleRefresh">
        <el-icon><i-ep-refresh /></el-icon>
        换一换
      </el-button>
    </div>
    <div class="author-list">
      <div v-for="author in authorList" :key="author.id" class="author-item">
        <el-avatar :size="45" :src="author.avatar" />
        <div class="author-info">
          <div class="author-name">{{ author.name }}</div>
          <div class="author-desc">{{ author.description }}</div>
        </div>
        <el-button size="small" type="primary" plain class="follow-btn">关注</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.recommend-authors {
  background-color: #fff;
  border-radius: 4px;
  padding: 16px;
  position: sticky;
  top: 20px;
  border: 1px solid #e4e6eb;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .title {
      font-size: 14px;
      font-weight: 600;
      color: #1d2129;
    }

    .refresh-btn {
      font-size: 13px;
      color: #1e80ff;
      padding: 0;

      &:hover {
        color: #1171ee;
      }

      .el-icon {
        font-size: 14px;
        margin-right: 4px;
      }
    }
  }

  .author-list {
    .author-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e4e6eb;

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      &:first-child {
        padding-top: 0;
      }

      .author-info {
        flex: 1;
        margin: 0 12px;
        min-width: 0;

        .author-name {
          font-size: 14px;
          color: #252933;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .author-desc {
          font-size: 13px;
          color: #8a919f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .follow-btn {
        padding: 5px 12px;
        height: 28px;
        font-size: 13px;
        border-radius: 4px;
        border-color: #1e80ff;
        color: #1e80ff;

        &:hover {
          color: #fff;
          background-color: #1e80ff;
        }
      }
    }
  }
}
</style>
