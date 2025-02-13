<script setup lang="ts">
import { HomeFilled, Star, Compass, MoreFilled, Edit, Delete } from "@element-plus/icons-vue"
import { onMounted, ref, onBeforeUnmount, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { emitter, EventTypes } from "@/utils/eventBus/index"
import { ElMessageBox, ElMessage } from "element-plus"

import api from "@/apis"
import { useUserStore } from "@/stores/userInfo"
import type { KnowledgeBases } from "@/types/notes"
import MaterialSymbolsBook from "@/components/icons/MaterialSymbolsBook.vue"
import type { ApiResponse } from "@/types/response"

const router = useRouter()
const route = useRoute()

// 根据当前路由计算激活的菜单项
const activeIndex = computed(() => {
  const path = route.path
  switch (path) {
    case "/dashboard":
      return "1"
    case "/dashboard/collections":
      return "2"
    case "/dashboard/explore":
      return "3"
    default:
      // 如果是编辑器页面，根据 kbId 参数设置激活项
      if (path === "/editor" && route.query.kbId) {
        return `kb-${route.query.kbId}`
      }
      return "1"
  }
})

const defaultOpeneds = ref(["4"])

// 模拟知识库数据，实际应该从后端获取
const knowledgeBases = ref<KnowledgeBases[]>([])

const userStore = useUserStore()
const getKnowledgeBasesList = () => {
  api.notes.getKnowledgeBasesList({ user_id: userStore.userId }).then((res) => {
    knowledgeBases.value = res.data
  })
}

const handleSelect = (index: string) => {
  switch (index) {
    case "1":
      router.push("/dashboard")
      break
    case "2":
      router.push("/dashboard/collections")
      break
    case "3":
      router.push("/dashboard/explore")
      break
    default:
      // 处理知识库的路由跳转
      if (index.startsWith("kb-")) {
        const kbId = index.split("-")[1]
        router.push({
          path: "/editor",
          query: { kbId },
        })
      }
  }
}

const handleCommand = async ({ type, id }: { type: string; id: number }) => {
  const kb = knowledgeBases.value.find((k) => k.id === id)
  if (!kb) return

  if (type === "rename") {
    try {
      const { value: newName } = await ElMessageBox.prompt("请输入新的知识库名称", "重命名知识库", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: kb.name,
        inputValidator: (value) => {
          if (!value.trim()) {
            return "知识库名称不能为空"
          }
          return true
        },
      })

      if (newName && newName.trim() !== kb.name) {
        const res = (await api.notes.updateKnowledgeBases({
          id: String(id),
          name: newName.trim(),
          type: kb.type,
        })) as unknown as ApiResponse<null>

        if (res.code === 200) {
          ElMessage.success("重命名成功")
          getKnowledgeBasesList()
        } else {
          ElMessage.error(res.msg || "重命名失败")
        }
      }
    } catch {
      // 用户取消操作
    }
  } else if (type === "delete") {
    try {
      await ElMessageBox.confirm("确定要删除该知识库吗？此操作不可恢复。", "删除知识库", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })

      const res = (await api.notes.deleteKnowledgeBases({
        id: String(id),
      })) as unknown as ApiResponse<null>

      if (res.code === 200) {
        ElMessage.success("删除成功")
        getKnowledgeBasesList()
      } else {
        ElMessage.error(res.msg || "删除失败")
      }
    } catch {
      // 用户取消操作
    }
  }
}

onMounted(() => {
  getKnowledgeBasesList()
  // 监听刷新知识库列表事件
  emitter.on(EventTypes.REFRESH_KB_LIST, getKnowledgeBasesList)
})

onBeforeUnmount(() => {
  // 移除事件监听
  emitter.off(EventTypes.REFRESH_KB_LIST, getKnowledgeBasesList)
})
</script>

<template>
  <div class="aside-content">
    <el-menu
      :default-active="activeIndex"
      :default-openeds="defaultOpeneds"
      class="menu-list"
      :background-color="'transparent'"
      @select="handleSelect"
    >
      <el-menu-item index="1">
        <el-icon><HomeFilled /></el-icon>
        <span>开始</span>
      </el-menu-item>
      <el-menu-item index="2">
        <el-icon><Star /></el-icon>
        <span>收藏</span>
      </el-menu-item>
      <el-menu-item index="3">
        <el-icon><Compass /></el-icon>
        <span>逛逛</span>
      </el-menu-item>

      <el-sub-menu index="4">
        <template #title>
          <span>知识库</span>
        </template>
        <el-menu-item v-for="kb in knowledgeBases" :key="kb.id" :index="'kb-' + kb.id">
          <div class="kb-content">
            <MaterialSymbolsBook class="kb-icon" />
            <span>{{ kb.name }}</span>
          </div>
          <div class="kb-actions">
            <el-dropdown trigger="click" @command="handleCommand">
              <el-button class="action-btn" link :icon="MoreFilled" @click.stop />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ type: 'rename', id: kb.id }">
                    <el-icon><Edit /></el-icon>
                    <span>重命名</span>
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ type: 'delete', id: kb.id }">
                    <el-icon><Delete /></el-icon>
                    <span>删除</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<style scoped lang="less">
.aside-content {
  padding: 8px;

  .menu-list {
    border: none;

    :deep(.el-menu-item) {
      height: 36px;
      line-height: 36px;
      border-radius: 4px;
      margin: 4px 0;

      &:hover {
        background-color: #f2f3f5;
      }

      &.is-active {
        background-color: #e8f3ff;
        color: #1677ff;
        font-weight: 500;
      }

      .el-icon {
        font-size: 16px;
      }

      .kb-icon {
        margin-right: 8px;
        font-size: 18px;
        color: #7dd3fc;
      }

      .kb-content {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        height: 100%;

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .kb-actions {
        opacity: 0;
        transition: opacity 0.2s ease;
        margin-left: 8px;
        display: flex;
        align-items: center;
        height: 100%;

        .action-btn {
          padding: 4px;
          height: 24px;
          width: 24px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            color: var(--el-color-primary);
          }
        }
      }

      &:hover {
        .kb-actions {
          opacity: 1;
        }
      }
    }

    :deep(.el-sub-menu) {
      margin-top: 12px;

      .el-sub-menu__title {
        height: 36px;
        line-height: 36px;
        color: #4e5969;
        border-radius: 4px;

        &:hover {
          background-color: #f2f3f5;
        }

        .el-icon {
          font-size: 12px;
        }
      }

      .el-menu {
        background-color: transparent;
      }

      &.is-active {
        .el-sub-menu__title {
          color: #1677ff;
        }
      }
    }
  }

  :deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;

    .el-icon {
      margin-right: 0;
    }
  }
}
</style>
