<script setup lang="ts">
import { Bell, HomeFilled, Star, Compass, CaretRight } from "@element-plus/icons-vue"
import { ref } from "vue"
import AsideHeader from "./components/AsideHeader.vue"
import AsideContent from "./components/AsideContent.vue"
</script>

<template>
  <div class="aside-container">
    <AsideHeader />
    <AsideContent />
    <div class="aside-footer"></div>
  </div>
</template>

<style scoped lang="less">
.aside-container {
  width: 220px;
  height: 100vh;
  background-color: #fafafa;
}
</style>
