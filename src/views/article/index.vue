<template>
  <div class="article-container">
    <article-header :title="articleTitle" :is-paid="isPaid" :is-collected="isCollected" />
    <div class="article-main">
      <article-content @update:article-info="updateArticleInfo" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import ArticleHeader from "./components/ArticleHeader.vue"
import ArticleContent from "./components/ArticleContent.vue"

const articleTitle = ref("")
const isPaid = ref(false)
const isCollected = ref(false)

const updateArticleInfo = (info: { title: string; type: number; is_collected: boolean }) => {
  articleTitle.value = info.title
  isPaid.value = info.type === 1
  isCollected.value = info.is_collected
}
</script>

<style lang="less" scoped>
.article-container {
  width: 100%;
  height: 100vh;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;

  .article-main {
    flex: 1;
    display: flex;
    padding: 20px 0px;
    overflow: hidden;
    justify-content: center;
  }
}
</style>
