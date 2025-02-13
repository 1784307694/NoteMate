<script setup lang="ts">
import { ref, onMounted } from "vue"
import type { TabPaneName } from "element-plus"
import ArrowCircleRightOutline from "@/components/icons/arrow-circle-right-outline.vue"
import apis from "@/apis"
import formatDate from "@/utils/date/index"
import { ElMessage } from "element-plus"

interface Note {
  id: number
  title: string
  introduction: string | null
  cover: string | null
  author_name: string
  author_avatar: string | null
  knowledge_base_name: string
  price: number
  type: number
  status: number
  created_at: string
  updated_at: string
  view_count: number
  buy_count: number
  like_count: number
  user_id: number
  knowledge_bases_id: number
}

const activeTab = ref<TabPaneName>("recommend")
const noteList = ref<Note[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)
const hasMore = ref(true)
const distance = ref(200)
const isLoading = ref(false)

const handleTabChange = (name: TabPaneName) => {
  console.log("当前选中:", name)
  // 切换标签时重置分页状态
  currentPage.value = 1
  hasMore.value = true
  noteList.value = []
  loadMore()
}

const loadMore = async () => {
  if (isLoading.value || !hasMore.value || loading.value) return
  isLoading.value = true
  loading.value = true

  try {
    console.log("开始加载数据:", { page: currentPage.value, pageSize: pageSize.value })
    // 调用API获取文章列表
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      status: 1, // 只显示公开的文章
    }

    const res = await apis.notes.getNotesList(params)
    console.log("API返回数据:", res)

    // 检查返回的数据结构
    if (!res || !res.data) {
      console.error("API返回数据格式错误:", res)
      if (currentPage.value === 1) {
        hasMore.value = false
        noteList.value = []
      }
      return
    }

    const data = res.data

    // 处理数据，设置默认值
    const processedData = data.map((note: any) => ({
      id: note.id,
      title: note.title || "无标题",
      introduction: note.introduction || "暂无简介",
      cover: note.cover || null,
      knowledge_base_name: note.knowledge_base_name || "",
      price: note.price || 0,
      type: note.type || 0,
      status: note.status || 0,
      created_at: note.updated_at || note.created_at || new Date().toISOString(),
      updated_at: note.updated_at || note.created_at || new Date().toISOString(),
      view_count: note.view_count || 0,
      buy_count: note.buy_count || 0,
      like_count: note.like_count || 0,
      user_id: note.user_id || 0,
      knowledge_bases_id: note.knowledge_bases_id || 0,
      author_avatar: note.author_avatar || null,
      author_name: note.author_name,
    }))

    console.log("处理后的数据:", processedData)

    if (currentPage.value === 1) {
      noteList.value = processedData
    } else {
      noteList.value.push(...processedData)
    }

    console.log("当前列表数据:", noteList.value)

    // 更新hasMore的逻辑
    currentPage.value++
  } catch (error) {
    console.error("加载文章失败:", error)
    if (currentPage.value === 1) {
      hasMore.value = false
      noteList.value = []
    }
    ElMessage.error("加载文章失败，请稍后重试")
  } finally {
    loading.value = false
    isLoading.value = false
  }
}

// 添加一个初始化函数
const initList = () => {
  currentPage.value = 1
  noteList.value = []
  hasMore.value = true
  loading.value = false
  isLoading.value = false
  loadMore()
}

// 在组件挂载时加载数据
onMounted(() => {
  initList()
})

// 处理文章跳转
const handleArticleClick = (noteId: number) => {
  const url = `/article?note_id=${noteId}`
  window.open(url, "_blank")
}

defineExpose({
  loadMore,
})
</script>

<template>
  <div class="article-container">
    <!-- 顶部导航 -->
    <div class="nav-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="关注" name="follow"></el-tab-pane>
        <el-tab-pane label="推荐" name="recommend"></el-tab-pane>
      </el-tabs>
    </div>

    <div
      class="article-list"
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="loading || !hasMore || isLoading"
      :infinite-scroll-distance="200"
      :infinite-scroll-delay="200"
      :infinite-scroll-immediate="false"
    >
      <div v-for="note in noteList" :key="note.id" class="article-item">
        <div class="article-main">
          <div class="article-user">
            <el-avatar :size="40" :src="note.author_avatar || 'https://placeholder.co/40x40'" />
            <div class="user-info">
              <span class="username">{{ note.author_name }}</span>
              <span class="post-time">{{ formatDate(note.created_at) }}</span>
            </div>
          </div>
          <div class="article-content">
            <div class="content-main">
              <h3 class="title" @click="handleArticleClick(note.id)">{{ note.title }}</h3>
              <p class="brief">{{ note.introduction }}</p>
              <div class="article-footer">
                <div class="actions">
                  <label class="like-button">
                    <input type="checkbox" />
                    <svg class="like-icon" width="24" height="24" viewBox="0 0 24 24">
                      <path
                        d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                      ></path>
                    </svg>
                    <span class="like-count">{{ note.like_count }}</span>
                  </label>
                  <span class="action-item view-more" @click="handleArticleClick(note.id)">
                    <ArrowCircleRightOutline class="view-icon" />
                    <span>查看全文 · {{ note.view_count }}阅读</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="cover-image" v-if="note.cover && note.cover !== 'null'">
              <el-image :src="note.cover" fit="cover" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading" class="loading-more">
        <el-icon class="is-loading"><i-ep-loading /></el-icon>
        加载中...
      </div>
      <div v-else-if="!hasMore" class="loading-more">没有更多了</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.article-container {
  flex: 1;
  max-width: 900px;

  .nav-tabs {
    margin-bottom: 16px;
    background-color: #fff;
    border-radius: 4px;
    padding: 0 16px;

    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: none;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      font-size: 18px;
      font-weight: 400;
      padding: 12px 0;
      margin-right: 24px;
      color: #1d2129 !important;

      &.is-active {
        font-weight: 600;
        color: #1d2129 !important;
      }
    }
  }
}

.article-list {
  .article-item {
    padding: 16px 20px;
    margin-bottom: 0;
    background-color: #fff;
    border-radius: 4px;
    border-bottom: 1px solid #e4e6eb;

    &:last-child {
      border-bottom: none;
    }

    .article-main {
      .article-user {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .user-info {
          margin-left: 12px;

          .username {
            font-size: 13px;
            color: #515767;
            margin-right: 12px;
          }

          .post-time {
            font-size: 13px;
            color: #8a919f;
          }
        }
      }

      .article-content {
        display: flex;
        gap: 20px;
        align-items: center;

        .content-main {
          flex: 1;
          min-width: 0;
          padding: 8px 0;

          .title {
            font-size: 16px;
            font-weight: 700;
            color: #1d2129;
            margin: 0 0 12px;
            line-height: 1.4;
            cursor: pointer;

            &:hover {
              color: #1e80ff;
            }
          }

          .brief {
            font-size: 13px;
            color: #86909c;
            line-height: 22px;
            margin: 0 0 12px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .cover-image {
          flex-shrink: 0;
          width: 200px;
          height: 120px;
          border-radius: 4px;
          overflow: hidden;

          .el-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
      }

      .article-footer {
        margin-top: 12px;

        .actions {
          display: flex;
          gap: 16px;
          align-items: center;

          .like-button {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 3px;
            position: relative;

            input {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              border: 0;
            }

            .like-icon {
              width: 20px;
              height: 20px;
              fill: #8a919f;
              transition: all 0.2s;
              transform-origin: center;
            }

            .like-count {
              color: #8a919f;
              font-size: 13px;
              transition: color 0.2s;
            }

            input:checked + .like-icon {
              animation: like 0.3s;
              fill: #ff3040;
            }

            input:checked ~ .like-count {
              color: #ff3040;
            }

            &:hover {
              background-color: rgba(255, 48, 64, 0.1);

              .like-icon {
                transform: scale(1.1);
              }
            }
          }

          @keyframes like {
            0% {
              transform: scale(1);
            }
            25% {
              transform: scale(1.2);
            }
            50% {
              transform: scale(0.95);
            }
            100% {
              transform: scale(1);
            }
          }

          .action-item {
            &.view-more {
              display: flex;
              align-items: center;
              gap: 4px;
              color: #1e80ff;
              font-size: 13px;
              cursor: pointer;
              padding: 4px 6px;
              border-radius: 3px;

              .view-icon {
                width: 16px;
                height: 16px;
              }

              &:hover {
                background-color: rgba(30, 128, 255, 0.1);
              }
            }
          }
        }
      }
    }
  }
}

.loading-more {
  text-align: center;
  color: #8a919f;
  padding: 16px 0;
  font-size: 13px;
}
</style>
