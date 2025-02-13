<template>
  <div class="editor-aside">
    <div class="header">
      <div class="back-btn" @click="router.push('/dashboard')">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回主页</span>
      </div>
      <div class="library-info">
        <MaterialSymbolsBook class="icon" />
        <span class="title">{{ kbName }}</span>
      </div>
    </div>

    <div class="content">
      <el-scrollbar>
        <div class="document-list">
          <div class="section">
            <div class="section-header">
              <span class="section-title">文档</span>
              <el-button
                class="add-btn"
                type="primary"
                link
                :icon="Plus"
                @click.stop="handleCreateNote"
              />
            </div>
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="document-item"
              :class="{ active: doc.id === activeDocId }"
              @click="handleDocClick(doc.id)"
            >
              <div class="item-content">
                <el-icon><Document /></el-icon>
                <template v-if="doc.id === editingId">
                  <div class="editing-wrapper">
                    <el-input
                      v-model="editingTitle"
                      size="small"
                      @keyup.enter="handleEditComplete"
                      @keyup.esc="cancelEdit"
                      v-focus
                    >
                      <template #append>
                        <el-icon class="editing-icon" @click="handleEditComplete"
                          ><Check
                        /></el-icon>
                        <el-icon class="editing-icon" @click="cancelEdit"><Close /></el-icon>
                      </template>
                    </el-input>
                  </div>
                </template>
                <span v-else class="doc-title">{{ doc.title }}</span>
              </div>
              <div class="item-actions">
                <el-dropdown trigger="click" @command="handleCommand">
                  <el-button link :icon="MoreFilled" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ type: 'rename', id: doc.id }">
                        <el-icon><Edit /></el-icon>
                        <span>重命名</span>
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ type: 'permission', id: doc.id }">
                        <el-icon><Setting /></el-icon>
                        <span>权限设置</span>
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ type: 'delete', id: doc.id }">
                        <el-icon><Delete /></el-icon>
                        <span>删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 权限设置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限设置"
      width="400px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="文档类型">
          <el-select v-model="docType" class="permission-select">
            <el-option label="免费" :value="0" />
            <el-option label="付费" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="公开状态">
          <el-select v-model="docStatus" class="permission-select">
            <el-option
              v-for="(label, value) in { '0': '私有', '2': '公开' }"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="docType === 1" label="价格">
          <el-input-number
            v-model="docPrice"
            :min="0"
            :precision="2"
            :step="0.01"
            class="permission-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePermissionSetting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue"
import MaterialSymbolsBook from "@/components/icons/MaterialSymbolsBook.vue"
import {
  Document,
  Plus,
  Edit,
  Delete,
  MoreFilled,
  ArrowLeft,
  Check,
  Close,
  Setting,
} from "@element-plus/icons-vue"
import { ElMessageBox, ElMessage } from "element-plus"
import { useRoute, useRouter } from "vue-router"
import apis from "@/apis"
import type { ApiResponse } from "@/types/response"
import { useUserStore } from "@/stores/userInfo"

// 自定义指令：自动聚焦
const vFocus = {
  mounted: (el: HTMLElement) => {
    const input = el.querySelector("input")
    if (input) {
      input.focus()
      input.select()
    }
  },
}

interface DocItem {
  id: number
  title: string
  status: number
  type: number
  cover?: string
  introduction?: string
  content?: string
  created_at: string
  updated_at: string
  price?: number
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const activeDocId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const editingTitle = ref("")
const documents = ref<DocItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(9999)
const total = ref(0)
const currentKbId = ref<number | null>(null)
const kbName = ref("")
const permissionDialogVisible = ref(false)
const currentDoc = ref<DocItem | null>(null)
const docType = ref(0)
const docStatus = ref(0)
const docPrice = ref(0)

const emit = defineEmits<{
  (e: "select-note", noteId: number): void
}>()

// 获取笔记列表
const fetchNotesList = async (kbId?: number) => {
  if (!kbId) return

  try {
    loading.value = true
    const res = (await apis.notes.getKnowledgeBasesNotesList({
      knowledge_bases_id: kbId,
      page: currentPage.value,
      page_size: pageSize.value,
    })) as unknown as ApiResponse<DocItem[]>
    documents.value = res.data

    // 如果URL中有noteId参数，优先选中它
    const noteId = route.query.noteId
    if (noteId) {
      activeDocId.value = Number(noteId)
      emit("select-note", Number(noteId))
    }
    // 否则，如果有笔记且当前没有选中的笔记，自动选择第一个
    else if (documents.value.length > 0 && !activeDocId.value) {
      const firstNote = documents.value[0]
      activeDocId.value = firstNote.id
      emit("select-note", firstNote.id)
    }
  } catch (error) {
    console.error("获取笔记列表失败:", error)
    ElMessage.error("获取笔记列表失败")
  } finally {
    loading.value = false
  }
}

// 刷新笔记列表
const refreshNotesList = () => {
  console.log("刷新笔记列表", currentKbId.value)
  if (currentKbId.value) {
    fetchNotesList(currentKbId.value)
  }
}

// 获取知识库名称
const getKnowledgeBaseName = async (kbId: number) => {
  try {
    const res = (await apis.notes.getKnowledgeBasesList({
      user_id: userStore.userId,
    })) as unknown as ApiResponse<any[]>
    if (res.code === 200) {
      const kb = res.data.find((item) => item.id === kbId)
      if (kb) {
        kbName.value = kb.name
      }
    }
  } catch (error) {
    console.error("获取知识库信息失败:", error)
  }
}

// 监听路由参数变化
watch(
  () => route.query.kbId,
  (newKbId) => {
    if (newKbId) {
      currentKbId.value = Number(newKbId)
      getKnowledgeBaseName(currentKbId.value)
      fetchNotesList(currentKbId.value)
    }
  },
  { immediate: true },
)

const handleDocClick = (id: number) => {
  if (editingId.value === null) {
    activeDocId.value = id
    emit("select-note", id)
    // 更新路由参数，保持其他参数不变
    router.replace({
      path: route.path,
      query: {
        ...route.query,
        noteId: String(id),
      },
    })
  }
}

const handleCommand = async ({ type, id }: { type: string; id: number }) => {
  const doc = documents.value.find((d) => d.id === id)
  if (!doc) return

  if (type === "rename") {
    editingId.value = id
    editingTitle.value = doc.title
  } else if (type === "permission") {
    currentDoc.value = doc
    docType.value = doc.type
    docStatus.value = doc.status
    docPrice.value = doc.price || 0
    permissionDialogVisible.value = true
  } else if (type === "delete") {
    try {
      await ElMessageBox.confirm("确定要删除该文档吗？此操作不可恢复。", "删除文档", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
      const res = (await apis.notes.deleteNote({ note_id: id })) as unknown as ApiResponse<null>
      if (res.code === 200) {
        ElMessage.success("删除成功")
        // 如果删除的是当前选中的文档，清空选中状态
        if (activeDocId.value === id) {
          activeDocId.value = null
          // 更新路由参数，移除 noteId
          router.replace({
            path: route.path,
            query: {
              ...route.query,
              noteId: undefined,
            },
          })
        }
        // 刷新列表
        if (currentKbId.value) {
          await fetchNotesList(currentKbId.value)
          // 如果列表不为空，自动选中第一个文档
          if (documents.value.length > 0) {
            const firstNote = documents.value[0]
            activeDocId.value = firstNote.id
            emit("select-note", firstNote.id)
            router.replace({
              path: route.path,
              query: {
                ...route.query,
                noteId: String(firstNote.id),
              },
            })
          }
        }
      } else {
        ElMessage.error(res.msg || "删除失败")
      }
    } catch {
      // 用户取消操作
    }
  }
}

const handleEditComplete = async () => {
  if (editingId.value === null) return

  const doc = documents.value.find((d) => d.id === editingId.value)
  if (doc && editingTitle.value.trim()) {
    try {
      const res = (await apis.notes.updateNote({
        id: editingId.value,
        title: editingTitle.value.trim(),
      })) as unknown as ApiResponse<null>

      if (res.code === 200) {
        ElMessage.success("更新成功")
        if (currentKbId.value) {
          await fetchNotesList(currentKbId.value)
        }
      } else {
        ElMessage.error(res.msg || "更新失败")
      }
    } catch (error) {
      console.error("更新笔记失败:", error)
      ElMessage.error("更新笔记失败")
    }
  }
  editingId.value = null
  editingTitle.value = ""
}

const cancelEdit = () => {
  editingId.value = null
  editingTitle.value = ""
}

// 创建新文档
const handleCreateNote = async () => {
  if (!currentKbId.value) {
    ElMessage.warning("请先选择知识库")
    return
  }

  try {
    const res = (await apis.notes.createNote({
      knowledge_bases_id: currentKbId.value,
      title: "新建文档",
    })) as unknown as ApiResponse<{ id: number }>

    if (res.code === 200 && res.data && res.data.id) {
      ElMessage.success("创建成功")
      // 先设置选中状态
      activeDocId.value = res.data.id
      emit("select-note", res.data.id)
      // 更新路由参数，保持其他参数不变
      router.replace({
        path: route.path,
        query: {
          ...route.query,
          noteId: String(res.data.id),
        },
      })
      // 然后刷新列表
      await fetchNotesList(currentKbId.value)
    } else {
      ElMessage.error(res.msg || "创建失败")
    }
  } catch (error) {
    console.error("创建文档失败:", error)
    ElMessage.error("创建文档失败")
  }
}

const handlePermissionSetting = async () => {
  if (!currentDoc.value) return

  try {
    const res = (await apis.notes.updateNote({
      id: currentDoc.value.id,
      title: currentDoc.value.title,
      type: docType.value,
      status: docStatus.value,
      price: docType.value === 1 ? docPrice.value : undefined,
    })) as unknown as ApiResponse<null>

    if (res.code === 200) {
      ElMessage.success("权限设置更新成功")
      permissionDialogVisible.value = false
      // 刷新列表
      if (currentKbId.value) {
        await fetchNotesList(currentKbId.value)
      }
    } else {
      ElMessage.error(res.msg || "更新失败")
    }
  } catch (error) {
    console.error("更新权限设置失败:", error)
    ElMessage.error("更新失败")
  }
}

onMounted(() => {
  if (route.query.kbId) {
    currentKbId.value = Number(route.query.kbId)
    getKnowledgeBaseName(currentKbId.value)
    fetchNotesList(currentKbId.value)
  }
})

defineExpose({
  refreshNotesList,
})
</script>

<style scoped lang="less">
.editor-aside {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;

  .header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-color-primary-light-9);
    display: flex;
    flex-direction: column;
    gap: 12px;

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--el-text-color-secondary);
      font-size: 14px;
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-primary);
      }

      .el-icon {
        font-size: 16px;
      }
    }

    .library-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .icon {
        font-size: 24px;
        color: var(--el-color-primary);
      }

      .title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        letter-spacing: 0.5px;
      }
    }
  }

  .content {
    flex: 1;
    overflow: hidden;

    .document-list {
      padding: 16px;

      .section {
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 0 8px;
          position: relative;

          .section-title {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .add-btn {
            padding: 4px;
            font-size: 16px;
            position: relative;
            z-index: 10;

            &:hover {
              color: var(--el-color-primary);
              background-color: var(--el-color-primary-light-9);
            }
          }
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          margin-bottom: 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;

          .item-content {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;

            .el-icon {
              font-size: 16px;
              color: var(--el-text-color-secondary);
              flex-shrink: 0;
            }

            .doc-title {
              color: var(--el-text-color-primary);
              font-size: 14px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .editing-wrapper {
              flex: 1;
              min-width: 0;

              :deep(.el-input) {
                --el-input-border-color: var(--el-border-color-light);

                .el-input__wrapper {
                  padding: 0 8px;
                  box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
                  background: var(--el-color-white);
                  transition: all 0.2s;

                  &:hover {
                    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
                  }

                  &.is-focus {
                    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
                  }
                }

                .el-input__inner {
                  height: 28px;
                  font-size: 14px;
                }

                .el-input-group__append {
                  padding: 0;
                  background: none;
                  border: none;
                  display: flex;
                  align-items: center;
                }

                .editing-icon {
                  padding: 4px;
                  font-size: 16px;
                  cursor: pointer;
                  color: var(--el-text-color-secondary);
                  transition: all 0.2s;

                  &:hover {
                    color: var(--el-color-primary);
                    transform: scale(1.1);
                  }

                  &:first-child {
                    margin-right: 2px;
                  }
                }
              }
            }
          }

          .item-actions {
            opacity: 0;
            transition: opacity 0.2s ease;

            :deep(.el-dropdown) {
              vertical-align: middle;
            }

            .el-button {
              padding: 4px;
              font-size: 16px;
            }
          }

          &:hover {
            background-color: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary-light-5);

            .item-actions {
              opacity: 1;
            }
          }

          &.active {
            background-color: var(--el-color-primary-light-8);
            border-color: var(--el-color-primary-light-3);

            .item-content {
              .el-icon {
                color: var(--el-color-primary);
              }

              .doc-title {
                color: var(--el-color-primary);
                font-weight: 500;
              }
            }

            .item-actions {
              opacity: 1;
            }
          }
        }
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

.permission-select {
  width: 100%;
}

.permission-input {
  width: 100%;
}

:deep(.el-dialog) {
  border-radius: 8px;

  .el-dialog__header {
    margin: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }

  .el-form-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
