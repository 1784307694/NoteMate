<script setup lang="ts">
import BookIcon from "@/components/icons/book.vue"
import BooksIcon from "@/components/icons/books.vue"
import AiIcon from "@/components/icons/ai.vue"
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { emitter, EventTypes } from "@/utils/eventBus/index"

import type { KnowledgeBases } from "@/types/notes"
import api from "@/apis"
import { useUserStore } from "@/stores/userInfo"
import type { ApiResponse } from "@/types/response"
import { ElMessage } from "element-plus"

const router = useRouter()
const dialogVisible = ref(false)
const createKbDialogVisible = ref(false)
const newKbName = ref("")
const newKbType = ref(0)

const handleCreateDoc = () => {
  dialogVisible.value = true
}

const handleCreateKb = () => {
  createKbDialogVisible.value = true
}

const handleConfirmCreateKb = async () => {
  if (!newKbName.value.trim()) {
    ElMessage.warning("请输入知识库名称")
    return
  }

  try {
    const res = (await api.notes.createKnowledgeBases({
      name: newKbName.value.trim(),
      type: newKbType.value,
    })) as unknown as ApiResponse<null>

    if (res.code === 200) {
      ElMessage.success("创建成功")
      // 重置表单
      newKbName.value = ""
      newKbType.value = 0
      // 关闭对话框
      createKbDialogVisible.value = false
      // 刷新知识库列表
      getKnowledgeBasesList()
      // 触发刷新侧边栏知识库列表事件
      emitter.emit(EventTypes.REFRESH_KB_LIST)
    } else {
      ElMessage.error(res.msg || "创建失败")
    }
  } catch (error) {
    console.error("创建知识库失败:", error)
    ElMessage.error("创建知识库失败")
  }
}

interface KnowledgeBase {
  id: number
  name: string
  type: number
  created_at: string
  updated_at: string
}

const knowledgeBases = ref<KnowledgeBase[]>([])

const userStore = useUserStore()
const getKnowledgeBasesList = () => {
  api.notes.getKnowledgeBasesList({ user_id: userStore.userId }).then((res) => {
    knowledgeBases.value = res.data
  })
}

// 创建文档并跳转
const handleCreateDocInKb = async (kbId: number) => {
  try {
    const res = (await api.notes.createNote({
      knowledge_bases_id: kbId,
      title: "新建文档",
    })) as unknown as ApiResponse<{ id: number }>

    if (res.code === 200 && res.data && res.data.id) {
      // 关闭对话框
      dialogVisible.value = false
      // 跳转到编辑器页面，并传入新建文档的ID
      router.push({
        path: "/editor",
        query: {
          kbId: String(kbId),
          noteId: String(res.data.id),
        },
      })
    } else {
      ElMessage.error(res.msg || "创建失败")
    }
  } catch (error) {
    console.error("创建文档失败:", error)
    ElMessage.error("创建文档失败")
  }
}

onMounted(() => {
  getKnowledgeBasesList()
})
</script>

<template>
  <div class="dashboard">
    <h2 class="dashboard-title">开始</h2>

    <div class="button-container">
      <!-- 新建文档按钮 -->
      <el-button class="feature-button" type="primary" plain @click="handleCreateDoc">
        <div class="button-content">
          <BookIcon class="button-icon" />
          <div class="button-info">
            <h3>新建文档</h3>
            <p>文档, 表格, 图表, 数据表</p>
          </div>
        </div>
      </el-button>

      <!-- 新建知识库按钮 -->
      <el-button class="feature-button" type="primary" plain @click="handleCreateKb">
        <div class="button-content">
          <BooksIcon class="button-icon" />
          <div class="button-info">
            <h3>新建知识库</h3>
            <p>使用知识库整理知识</p>
          </div>
        </div>
      </el-button>

      <!-- AI 帮你写按钮 -->
      <el-button class="feature-button" type="primary" plain>
        <div class="button-content">
          <AiIcon class="button-icon" />
          <div class="button-info">
            <h3>AI 帮你写</h3>
            <p>AI 助手帮你一键生成文档</p>
          </div>
        </div>
      </el-button>
    </div>

    <h2 class="dashboard-title">文档</h2>
    <div class="document-tabs">
      <el-tabs>
        <el-tab-pane label="编辑过"></el-tab-pane>
        <el-tab-pane label="浏览过"></el-tab-pane>
        <el-tab-pane label="我点赞的"></el-tab-pane>
        <el-tab-pane label="我评论过"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新建文档模态框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新建文档"
      width="460px"
      :show-close="true"
      :close-on-click-modal="false"
      align-center
    >
      <div class="dialog-content">
        <h3 class="dialog-subtitle">选择一个知识库</h3>
        <div class="library-list">
          <el-button
            class="library-item"
            v-for="item in knowledgeBases"
            :key="item.id"
            @click="handleCreateDocInKb(item.id)"
          >
            <span class="item-name">{{ userStore.username }} / {{ item.name }}</span>
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 新建知识库模态框 -->
    <el-dialog
      v-model="createKbDialogVisible"
      title="新建知识库"
      width="460px"
      :show-close="true"
      :close-on-click-modal="false"
      align-center
    >
      <div class="dialog-content">
        <el-form label-position="top">
          <el-form-item label="知识库名称">
            <el-input v-model="newKbName" placeholder="请输入知识库名称" />
          </el-form-item>
          <el-form-item label="知识库类型">
            <el-radio-group v-model="newKbType">
              <el-radio :label="0">私有</el-radio>
              <el-radio :label="1">公开</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createKbDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmCreateKb">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.dashboard {
  padding: 20px;

  .dashboard-title {
    font-size: 18px;
    font-weight: 500;
    color: #333;
    margin-bottom: 20px;
  }

  .button-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 40px;

    .feature-button {
      height: auto;
      padding: 16px;
      width: 100%;
      border-radius: 8px;
      transition: all 0.3s;
      display: flex;
      align-items: flex-start;
      text-align: left;
      background-color: transparent;
      border-color: #dcdfe6;

      &:deep(.el-button) {
        --el-button-hover-text-color: inherit;
        --el-button-hover-border-color: inherit;
        --el-button-hover-bg-color: inherit;
      }

      &:hover {
        transform: translateY(-2px);
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);

        .button-content {
          .button-icon {
            color: var(--el-color-primary);
          }

          .button-info {
            h3 {
              color: var(--el-color-primary);
            }
          }
        }
      }

      .button-content {
        display: flex;
        align-items: flex-start;
        width: 100%;

        .button-icon {
          font-size: 24px;
          margin-right: 16px;
          margin-top: 4px;
          color: var(--el-color-primary);
          transition: color 0.3s;
        }

        .button-info {
          flex: 1;

          h3 {
            font-size: 16px;
            font-weight: 500;
            color: #262626;
            margin: 0 0 8px 0;
            transition: color 0.3s;
          }

          p {
            font-size: 14px;
            color: #909399;
            margin: 0;
            line-height: 1.4;
          }
        }
      }
    }
  }

  .document-tabs {
    :deep(.el-tabs__item) {
      font-size: 14px;
    }
  }

  :deep(.el-dialog) {
    border-radius: 8px;

    .el-dialog__header {
      margin: 0;
      padding: 16px 20px;
      border-bottom: 1px solid #dcdfe6;

      .el-dialog__title {
        font-size: 16px;
        font-weight: 500;
        color: #262626;
      }
    }

    .el-dialog__body {
      padding: 20px;
    }
  }
}

.dialog-content {
  .dialog-subtitle {
    font-size: 14px;
    color: #262626;
    margin: 0 0 16px 0;
    font-weight: normal;
  }

  .library-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 -20px;
    padding: 0 20px;

    .library-item {
      width: 100%;
      height: 40px;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      border: 1px solid #dcdfe6;
      background-color: transparent;
      transition: all 0.3s;
      border-radius: 4px;

      &:hover {
        background-color: #f5f7fa;
      }

      .item-name {
        flex: 1;
        font-size: 14px;
        color: #262626;
        text-align: left;
        padding: 0 16px;
        line-height: 40px;
      }
    }

    :deep(.el-button.el-button--default) {
      --el-button-bg-color: transparent;
      --el-button-border-color: #dcdfe6;
      --el-button-hover-bg-color: #f5f7fa;
      --el-button-hover-border-color: #dcdfe6;
      --el-button-active-bg-color: #f5f7fa;
      --el-button-active-border-color: #dcdfe6;
      margin: 0;
    }
  }

  .el-form {
    .el-form-item {
      margin-bottom: 20px;

      :deep(.el-form-item__label) {
        padding-bottom: 8px;
        font-size: 14px;
        color: #262626;
      }

      .el-input {
        width: 100%;
      }

      .el-radio-group {
        display: flex;
        gap: 20px;
      }
    }
  }
}

:deep(.el-button) {
  --el-button-padding-horizontal: 0;
}
</style>
