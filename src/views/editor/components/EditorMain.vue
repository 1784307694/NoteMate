<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css" // 引入 css
import { onBeforeUnmount, ref, shallowRef, onMounted, watch, nextTick } from "vue"
import { Editor, Toolbar } from "@wangeditor/editor-for-vue"
import { ElTree, ElButton, ElMessage, ElAffix } from "element-plus"
import { Plus, Expand } from "@element-plus/icons-vue"
import type { UploadProps, UploadFile } from "element-plus"
import apis from "@/apis"
import type { ApiResponse } from "@/types/response"

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const valueHtml = ref("")
// 大纲数据
const outlineData = ref<any[]>([])
// 当前激活的大纲项索引
const activeIndex = ref(0)
// 当前笔记ID
const currentNoteId = ref<number | null>(null)
// 当前标题
const noteTitle = ref("")
// 文章简介
const noteIntroduction = ref("")

const emit = defineEmits<{
  (e: "refresh-notes"): void
}>()

// 工具栏配置
const toolbarConfig = {
  toolbarKeys: [
    "headerSelect",
    "|",
    "bold",
    "underline",
    "italic",
    "|",
    "color",
    "bgColor",
    "|",
    "fontSize",
    "fontFamily",
    "lineHeight",
    "|",
    "bulletedList",
    "numberedList",
    "todo",
    "|",
    "justifyLeft",
    "justifyCenter",
    "justifyRight",
    "|",
    "insertLink",
    "uploadImage",
    "insertImage",
    "insertTable",
    "divider",
    "|",
    "codeBlock",
    "blockquote",
    "|",
    "undo",
    "redo",
  ],
}

// 编辑器配置
const editorConfig = {
  placeholder: "请输入正文...",
  autoFocus: false,
  readOnly: false,
  scroll: false,
  MENU_CONF: {
    headerSelect: {
      title: "标题",
      items: [
        { value: "h1", text: "标题1" },
        { value: "h2", text: "标题2" },
        { value: "h3", text: "标题3" },
        { value: "h4", text: "标题4" },
        { value: "h5", text: "标题5" },
      ],
    },
    uploadImage: {
      // 自定义上传
      customUpload: async (file: File, insertFn: Function) => {
        try {
          const res = (await apis.base.uploadImage(file)) as unknown as ApiResponse<{
            url: string
          }>
          if (res.code === 200 && res.data?.url) {
            // 插入图片到编辑器
            insertFn(res.data.url)
            ElMessage.success(`图片 ${file.name} 上传成功`)
          } else {
            ElMessage.error(res.msg || "图片上传失败")
          }
        } catch (error) {
          console.error("图片上传失败:", error)
          ElMessage.error(`图片 ${file.name} 上传失败`)
        }
      },
      // 基本配置
      maxFileSize: 5 * 1024 * 1024, // 5M
      maxNumberOfFiles: 10,
      allowedFileTypes: ["image/*"],
      timeout: 30 * 1000, // 30秒
    },
  },
}

const mode = ref("default")

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

  const outline: any[] = []
  const stack: any[] = []

  headers.forEach((header: HTMLElement, index: number) => {
    const level = parseInt(header.tagName.slice(1))
    const text = header.textContent || ""

    // 为每个标题添加唯一标识
    const id = `header-${index}`
    header.id = id // 直接设置 id，不需要判断

    const node = {
      id,
      label: text,
      level,
      index,
      children: [],
    }

    // 根据标题级别构建树形结构
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      outline.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  })

  outlineData.value = outline
}

// 点击大纲项时滚动到对应位置
const handleNodeClick = (data: any) => {
  const editor = editorRef.value
  if (!editor) return

  const targetElement = document.getElementById(data.id)
  if (targetElement) {
    // 使用 scrollIntoView 实现平滑滚动
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })

    // 更新激活状态
    activeIndex.value = data.index
  }
}

// 添加代码块复制功能
const addCopyButtons = () => {
  const editor = editorRef.value
  if (!editor) return

  const codeBlocks = editor.getEditableContainer().querySelectorAll("pre > code")
  codeBlocks.forEach((codeBlock: HTMLElement) => {
    // 检查是否已经添加过复制按钮
    if (codeBlock.querySelector(".copy-button")) return

    const copyButton = document.createElement("button")
    copyButton.innerText = "复制"
    copyButton.className = "copy-button"

    copyButton.addEventListener("click", () => {
      const codeText = codeBlock.textContent || ""
      navigator.clipboard.writeText(codeText).then(() => {
        copyButton.innerText = "已复制"
        setTimeout(() => {
          copyButton.innerText = "复制"
        }, 2000)
      })
    })

    codeBlock.appendChild(copyButton)
  })
}

// 保存内容
const saveContent = async () => {
  if (!currentNoteId.value || !valueHtml.value) return

  try {
    ElMessage.info("正在保存...")
    const res = (await apis.notes.updateNoteContent({
      note_id: currentNoteId.value,
      content: valueHtml.value,
    })) as unknown as ApiResponse<null>

    if (res.code === 200) {
      ElMessage.success("保存成功")
    } else {
      console.error("保存失败:", res.msg)
      ElMessage.error(res.msg || "保存失败")
    }
  } catch (error) {
    console.error("保存失败:", error)
    ElMessage.error("保存失败")
  }
}

// 监听快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault() // 阻止浏览器默认保存行为
    saveContent()
  }
}

// 监听编辑器内容变化
const handleChange = () => {
  const editor = editorRef.value
  if (!editor) return

  valueHtml.value = editor.getHtml()
  updateOutline()
  nextTick(() => {
    addCopyButtons()
  })
}

// 组件挂载时
onMounted(() => {
  // 移除这里的初始内容设置，改为在 handleCreated 中设置
  valueHtml.value = "<p></p>"
  // 添加快捷键监听
  document.addEventListener("keydown", handleKeyDown)
})

// 组件销毁时
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    // 移除父容器的滚动监听
    const container = document.querySelector(".editor-content-wrapper")
    if (container) {
      container.removeEventListener("scroll", handleScroll)
    }
    editor.destroy()
  }
  // 移除快捷键监听
  document.removeEventListener("keydown", handleKeyDown)
})

const handleCreated = (editor: any) => {
  editorRef.value = editor

  // 确保编辑器可编辑
  nextTick(() => {
    editor.enable()
    editor.on("change", handleChange)

    // 设置初始内容
    editor.setHtml(``)

    updateOutline()
    addCopyButtons()

    // 添加滚动监听到父容器
    const container = document.querySelector(".editor-content-wrapper")
    if (container) {
      container.addEventListener("scroll", handleScroll)
    }
  })
}

// 封面图片相关
const coverImageUrl = ref("")

const handleCoverSuccess = async (uploadFile: UploadFile) => {
  try {
    const res = (await apis.base.uploadImage(uploadFile.raw!)) as unknown as ApiResponse<{
      url: string
    }>
    if (res.code === 200 && res.data?.url) {
      coverImageUrl.value = res.data.url
      // 更新笔记封面
      if (currentNoteId.value) {
        const updateRes = (await apis.notes.updateNote({
          id: currentNoteId.value,
          title: noteTitle.value,
          cover: res.data.url,
        })) as unknown as ApiResponse<null>
        if (updateRes.code === 200) {
          // 更新成功后，保存当前内容
          await saveContent()
          // 触发刷新事件
          emit("refresh-notes")
        } else {
          ElMessage.error(updateRes.msg || "封面更新失败")
        }
      }
    } else {
      ElMessage.error(res.msg || "封面上传失败")
    }
  } catch (error) {
    console.error("封面上传失败:", error)
    ElMessage.error("封面上传失败")
  }
}

const beforeCoverUpload: UploadProps["beforeUpload"] = (rawFile) => {
  if (!["image/jpeg", "image/png", "image/gif"].includes(rawFile.type)) {
    ElMessage.error("封面图片必须是 JPG/PNG/GIF 格式!")
    return false
  } else if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error("封面图片大小不能超过 5MB!")
    return false
  }
  return true
}

// 修改滚动监听逻辑
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

  // 找到距离视口中点最近的标题
  headers.forEach((header: HTMLElement, index: number) => {
    const rect = header.getBoundingClientRect()
    const distance = Math.abs(rect.top - viewportMiddle)

    if (distance < minDistance) {
      minDistance = distance
      currentHeader = header
    }
  })

  if (currentHeader) {
    const index = Array.from(headers).indexOf(currentHeader)
    if (index >= 0) {
      activeIndex.value = index
    }
  }
}

// 更新标题
const updateNoteTitle = async (title: string) => {
  if (!currentNoteId.value) return

  try {
    const res = (await apis.notes.updateNote({
      id: currentNoteId.value,
      title: title,
    })) as unknown as ApiResponse<null>

    if (res.code === 200) {
      // 更新成功后，保存当前内容
      await saveContent()
      // 触发刷新事件
      emit("refresh-notes")
    } else {
      console.error("更新标题失败:", res.msg)
      ElMessage.error(res.msg || "更新标题失败")
      // 如果更新失败，恢复原标题
      noteTitle.value = title
    }
  } catch (error) {
    console.error("更新标题失败:", error)
    ElMessage.error("更新标题失败")
    // 如果更新失败，恢复原标题
    noteTitle.value = title
  }
}

// 处理标题变化
let titleUpdateTimeout: number | null = null
const handleTitleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const newTitle = target.value
  noteTitle.value = newTitle

  // 使用防抖，避免频繁更新
  if (titleUpdateTimeout) {
    clearTimeout(titleUpdateTimeout)
  }
  titleUpdateTimeout = setTimeout(() => {
    updateNoteTitle(newTitle)
  }, 1000) // 增加延迟时间，减少更新频率
}

// 更新简介
const updateNoteIntroduction = async (introduction: string) => {
  if (!currentNoteId.value) return

  try {
    const res = (await apis.notes.updateNote({
      id: currentNoteId.value,
      title: noteTitle.value,
      introduction: introduction,
    })) as unknown as ApiResponse<null>

    if (res.code === 200) {
      // 更新成功后，保存当前内容
      await saveContent()
      // 触发刷新事件
      emit("refresh-notes")
    } else {
      console.error("更新简介失败:", res.msg)
      ElMessage.error(res.msg || "更新简介失败")
      // 如果更新失败，恢复原简介
      noteIntroduction.value = introduction
    }
  } catch (error) {
    console.error("更新简介失败:", error)
    ElMessage.error("更新简介失败")
    // 如果更新失败，恢复原简介
    noteIntroduction.value = introduction
  }
}

// 处理简介变化
let introductionUpdateTimeout: number | null = null
const handleIntroductionChange = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  const newIntroduction = target.value
  noteIntroduction.value = newIntroduction

  // 使用防抖，避免频繁更新
  if (introductionUpdateTimeout) {
    clearTimeout(introductionUpdateTimeout)
  }
  introductionUpdateTimeout = setTimeout(() => {
    updateNoteIntroduction(newIntroduction)
  }, 1000)
}

// 获取笔记内容
const fetchNoteContent = async (noteId: number) => {
  if (!noteId) return

  try {
    const res = (await apis.notes.getNoteDetail({ note_id: noteId })) as unknown as ApiResponse<{
      content: string
      title: string
      cover?: string
      introduction?: string
    }>
    if (res.code === 200) {
      editorRef.value?.setHtml(res.data.content || "")
      noteTitle.value = res.data.title || ""
      coverImageUrl.value = res.data.cover || ""
      noteIntroduction.value = res.data.introduction || ""
    } else {
      ElMessage.error(res.msg || "获取笔记内容失败")
    }
  } catch (error) {
    console.error("获取笔记内容失败:", error)
    ElMessage.error("获取笔记内容失败")
  }
}

// 处理笔记选择事件
const handleNoteSelect = (noteId: number | null) => {
  currentNoteId.value = noteId
  if (noteId === null) {
    // 清空编辑器内容
    editorRef.value?.setHtml("")
    noteTitle.value = ""
    return
  }
  fetchNoteContent(noteId)
}

defineExpose({
  handleNoteSelect,
})
</script>

<template>
  <div class="editor-main">
    <div class="editor-page">
      <div class="editor-content-wrapper">
        <div class="editor-container">
          <div class="editor-toolbar-wrapper">
            <Toolbar
              class="editor-toolbar"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="mode"
            />
          </div>
          <div class="title-container">
            <div class="title-wrapper">
              <input
                placeholder="请输入标题..."
                class="title-input"
                v-model="noteTitle"
                @input="handleTitleChange"
              />
              <el-upload
                class="cover-uploader"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleCoverSuccess"
                :before-upload="beforeCoverUpload"
              >
                <img v-if="coverImageUrl" :src="coverImageUrl" class="cover-image" />
                <div v-else class="cover-uploader-placeholder">
                  <el-icon class="cover-uploader-icon"><Plus /></el-icon>
                  <span>封面</span>
                </div>
              </el-upload>
            </div>
            <div class="introduction-wrapper">
              <textarea
                placeholder="请输入文章简介..."
                class="introduction-input"
                v-model="noteIntroduction"
                @input="handleIntroductionChange"
                rows="3"
              ></textarea>
            </div>
          </div>
          <Editor
            class="editor-content"
            v-model="valueHtml"
            :defaultConfig="editorConfig"
            :mode="mode"
            @onCreated="handleCreated"
          />
        </div>
        <div class="editor-outline">
          <el-affix :offset="10">
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
  </div>
</template>

<style scoped lang="less">
@import "@/assets/css/editor.less";
.title-container {
  padding: 20px 0;
  margin-bottom: 20px;

  .title-wrapper {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .title-input {
      flex: 1;
      font-size: 30px;
      border: none;
      outline: none;
      line-height: 1;
      color: #333;
      padding: 0;

      &::placeholder {
        color: #999;
      }
    }
  }

  .introduction-wrapper {
    .introduction-input {
      width: 100%;
      font-size: 14px;
      line-height: 1.6;
      color: #666;
      padding: 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      outline: none;
      resize: none;
      transition: all 0.3s;

      &:hover,
      &:focus {
        border-color: var(--el-color-primary);
      }

      &::placeholder {
        color: #999;
      }
    }
  }
}
</style>
