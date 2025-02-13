<script setup lang="ts">
import ArticleList from "./components/ArticleList.vue"
import RecommendAuthors from "./components/RecommendAuthors.vue"
</script>

<template>
  <div class="explore-container">
    <div class="main-content">
      <!-- 左侧文章列表 -->
      <ArticleList />

      <!-- 右侧推荐区域 -->
      <div class="aside-content">
        <RecommendAuthors />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.explore-container {
  padding: 16px;
  padding-left: 200px;
  background-color: #fff;

  .main-content {
    display: flex;
    gap: 16px;
  }

  .aside-content {
    width: 300px;
  }
}
</style>
