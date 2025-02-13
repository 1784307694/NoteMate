<template>
  <div class="article-content">
    <div class="content-wrapper">
      <div class="article-container">
        <div class="article-title">
          <div class="title-tag">
            <el-tag size="small" type="success">语音精选</el-tag>
          </div>
          <h1>{{ title }}</h1>
          <div class="article-info">
            <el-avatar :size="32" :src="authorAvatar" />
            <span class="author-name">{{ authorName }}</span>
            <span class="publish-time">{{ publishTime }}</span>
          </div>
        </div>
        <div class="article-main">
          <Editor
            class="editor-content"
            v-model="content"
            :defaultConfig="editorConfig"
            :mode="mode"
            @onCreated="handleCreated"
          />
        </div>
      </div>
      <div class="article-outline">
        <el-affix :offset="84">
          <div class="outline-header">
            <el-icon><Expand /></el-icon>
            <span>文档大纲</span>
          </div>
          <div class="outline-content">
            <el-tree
              :data="outlineData"
              :props="{
                label: 'label',
                children: 'children',
              }"
              :highlight-current="true"
              :expand-on-click-node="false"
              node-key="id"
              @node-click="handleNodeClick"
              class="outline-tree"
            />
          </div>
        </el-affix>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css"
import { ref, shallowRef, onMounted, onUnmounted, nextTick } from "vue"
import { Editor, IDomEditor } from "@wangeditor/editor-for-vue"
import { Menu, Expand } from "@element-plus/icons-vue"
import { useRoute } from "vue-router"
import apis from "@/apis"
import { ElMessage } from "element-plus"

const emit = defineEmits<{
  "update:article-info": [info: { title: string; type: number; is_collected: boolean }]
}>()

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

const route = useRoute()
const title = ref("")
const content = ref("")
const authorName = ref("")
const authorAvatar = ref("")
const publishTime = ref("")
const mode = ref("preview")

// 编辑器配置
const editorConfig = {
  readOnly: true,
  scroll: false,
  MENU_CONF: {},
  // 设置编辑器高度
  height: "auto",
  // 允许HTML
  html: true,
  // 设置编辑器默认内容
  defaultContent: "<p>加载中...</p>",
  // 设置编辑器样式
  style: {
    padding: "0",
    overflow: "visible",
  },
}

interface NoteDetailResponse {
  code: number
  msg: string
  data?: {
    title: string
    content: string
    author_name: string
    author_avatar: string
    created_at: string
    cover?: string
    introduction?: string
    type: number
    is_collected: boolean
  }
}

// 获取文章详情
const getArticleDetail = async () => {
  try {
    const note_id = route.query.note_id
    if (!note_id) {
      ElMessage.error("文章ID不存在")
      return
    }

    const res = (await apis.notes.getNoteDetail({
      note_id: Number(note_id),
    })) as unknown as NoteDetailResponse

    if (!res.data) {
      ElMessage.error(res.msg || "获取文章详情失败")
      return
    }

    if (res.code === 200) {
      title.value = res.data.title
      content.value = res.data.content
      authorName.value = res.data.author_name || "匿名作者"
      authorAvatar.value = res.data.author_avatar || ""
      publishTime.value = res.data.created_at || ""

      // 发送文章信息到父组件
      emit("update:article-info", {
        title: res.data.title,
        type: res.data.type || 0,
        is_collected: false, // 后端接口如果返回is_collected，这里使用实际值
      })

      // 等待编辑器初始化完成后更新内容和大纲
      nextTick(() => {
        if (editorRef.value) {
          editorRef.value.setHtml(res.data!.content)
          updateOutline()
        }
      })
    } else {
      ElMessage.error(res.msg || "获取文章详情失败")
    }
  } catch (error) {
    console.error(error)
    ElMessage.error("获取文章详情失败")
  }
}

interface OutlineItem {
  label: string
  level: number
  id: string
  children?: OutlineItem[]
}

const outlineData = ref<OutlineItem[]>([])
const currentId = ref("")

// 更新大纲
const updateOutline = () => {
  const editor = editorRef.value
  if (!editor) return

  // 获取所有标题元素
  const editorElem = editor.getEditableContainer()
  const headers = editorElem.querySelectorAll("h1, h2, h3, h4, h5")
  if (!headers.length) {
    outlineData.value = []
    return
  }

  const outline: OutlineItem[] = []
  const stack: OutlineItem[] = []

  headers.forEach((header: HTMLElement, index: number) => {
    const level = parseInt(header.tagName.slice(1))
    const text = header.textContent || ""

    // 为每个标题添加唯一标识
    const id = "header-" + index
    header.id = id

    const node: OutlineItem = {
      id,
      label: text,
      level,
      children: [],
    }

    // 根据标题级别构建树形结构
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      outline.push(node)
    } else {
      const parent = stack[stack.length - 1]
      if (!parent.children) parent.children = []
      parent.children.push(node)
    }

    stack.push(node)
  })

  outlineData.value = outline
}

// 点击大纲项目滚动到对应位置
const handleNodeClick = (data: OutlineItem) => {
  currentId.value = data.id
  const element = document.getElementById(data.id)
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

// 监听滚动更新当前位置
const handleScroll = () => {
  const editor = editorRef.value
  if (!editor) return

  const editorElem = editor.getEditableContainer()
  const headers = editorElem.querySelectorAll("h1, h2, h3, h4, h5")
  if (!headers.length) return

  // 获取可视区域的中点位置
  const viewportHeight = window.innerHeight
  const viewportMiddle = viewportHeight / 2

  let currentHeader: HTMLElement | null = null
  let minDistance = Infinity

  headers.forEach((header) => {
    const headerElement = header as HTMLElement
    const rect = headerElement.getBoundingClientRect()
    const distance = Math.abs(rect.top - viewportMiddle)

    if (distance < minDistance) {
      minDistance = distance
      currentHeader = headerElement
    }
  })

  if (currentHeader && currentHeader.id) {
    currentId.value = currentHeader.id
  }
}

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
  // 设置编辑器为只读模式
  editor.disable()
  // 初始化内容
  getArticleDetail()
}

onMounted(() => {
  getArticleDetail()
  // 添加滚动监听到父容器
  const container = document.querySelector(".content-wrapper")
  if (container) {
    container.addEventListener("scroll", handleScroll)
  }
})

onUnmounted(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
  // 移除滚动监听
  const container = document.querySelector(".content-wrapper")
  if (container) {
    container.removeEventListener("scroll", handleScroll)
  }
})
</script>

<style lang="less" scoped>
.article-content {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  .content-wrapper {
    height: calc(100vh - 64px);
    display: flex;
    gap: 24px;
    overflow-y: auto;
    justify-content: center;
    padding: 20px 0 20px 40px;

    .article-container {
      flex: 1;
      max-width: 900px;
      background-color: #fff;
      border-radius: 8px;
      padding: 32px 48px;
      margin-right: 24px;

      .article-title {
        text-align: center;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .title-tag {
          margin-bottom: 16px;
        }

        h1 {
          font-size: 32px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .article-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--el-text-color-secondary);

          .author-name {
            font-size: 14px;
            font-weight: 500;
          }

          .publish-time {
            font-size: 14px;
          }
        }
      }

      .article-main {
        :deep(.w-e-text-container) {
          min-height: auto !important;
          height: auto !important;
          border: none !important;
        }

        :deep(.w-e-scroll) {
          padding: 0 !important;
          overflow: visible !important;
        }

        :deep([data-slate-editor]) {
          padding: 0 !important;
          overflow: visible !important;

          h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 30px 0 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }

          h2 {
            font-size: 24px;
            font-weight: 600;
            margin: 25px 0 15px;
          }

          h3 {
            font-size: 20px;
            font-weight: 600;
            margin: 20px 0 15px;
          }

          h4 {
            font-size: 18px;
            font-weight: 600;
            margin: 15px 0 10px;
          }

          h5 {
            font-size: 16px;
            font-weight: 600;
            margin: 15px 0 10px;
          }

          p {
            line-height: 1.7;
            margin: 12px 0;
            font-size: 15px;
            color: #333;
          }

          ul,
          ol {
            margin: 16px 0;
            padding-left: 24px;
            line-height: 1.7;
            font-size: 15px;
            color: #333;
          }

          li {
            margin: 8px 0;
          }

          pre {
            position: relative;
            background-color: #f8f9fa;
            padding: 16px;
            border-radius: 4px;
            margin: 16px 0;

            code {
              font-family: Consolas, Monaco, "Andale Mono", monospace;
              font-size: 14px;
              line-height: 1.6;
              color: #333;
            }
          }

          blockquote {
            margin: 16px 0;
            padding: 0 16px;
            color: #666;
            border-left: 4px solid #ddd;
            font-style: italic;
          }

          img {
            max-width: 100%;
            height: auto;
            margin: 16px 0;
            border-radius: 4px;
          }
        }
      }
    }

    .article-outline {
      width: 280px;
      flex-shrink: 0;
      padding-right: 40px;

      .outline-header {
        padding: 16px 20px;
        background-color: #fff;
        border-radius: 8px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon {
          font-size: 18px;
        }

        span {
          font-size: 16px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }

      .outline-content {
        margin-top: 1px;
        padding: 12px;
        background-color: #fff;
        border-radius: 8px;
        max-height: calc(100vh - 200px);
        overflow-y: auto;

        :deep(.el-tree) {
          --el-tree-node-hover-bg-color: transparent;
          background: transparent;
        }

        :deep(.el-tree-node__content) {
          height: 32px;
        }

        :deep(.el-tree-node.is-current > .el-tree-node__content) {
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
          border-radius: 4px;
        }
      }
    }
  }
}
</style>
