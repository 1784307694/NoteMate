<script setup lang="ts">
import Aside from "./aside/index.vue"
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="220px">
        <Aside />
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="less">
.common-layout {
  height: 100vh;
  width: 100vw;

  :deep(.el-container) {
    height: 100%;
    width: 100%;
  }

  :deep(.el-aside) {
    height: 100%;
    border-right: 1px solid #e4e7ed;
    overflow-x: hidden;
  }

  :deep(.el-main) {
    padding-left: 10px;
  }
}
</style>
