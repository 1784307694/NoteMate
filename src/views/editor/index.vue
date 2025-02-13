<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import EditorAside from "./components/EditorAside.vue"
import EditorMain from "./components/EditorMain.vue"

const route = useRoute()
const editorMainRef = ref()
const editorAsideRef = ref()

const handleNoteSelect = (noteId: number) => {
  editorMainRef.value?.handleNoteSelect(noteId)
}

const handleRefreshNotes = () => {
  if (editorAsideRef.value) {
    editorAsideRef.value.refreshNotesList()
  }
}

// 监听路由参数，选中指定的笔记
onMounted(() => {
  const noteId = route.query.noteId
  if (noteId) {
    handleNoteSelect(Number(noteId))
  }
})
</script>

<template>
  <div class="editor">
    <EditorAside ref="editorAsideRef" @select-note="handleNoteSelect" />
    <EditorMain ref="editorMainRef" @refresh-notes="handleRefreshNotes" />
  </div>
</template>

<style scoped lang="less">
.editor {
  height: 100%;
  display: flex;
  gap: 1px;
  background-color: var(--el-border-color-lighter);

  :deep(.editor-aside) {
    width: 280px;
  }

  :deep(.editor-main) {
    flex: 1;
  }
}
</style>
