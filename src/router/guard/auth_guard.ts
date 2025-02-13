import type { Router } from "vue-router"
import useTokenStore from "@/stores/token"
import useUserStore from "@/stores/userInfo"

// 白名单路径，这些路径不需要验证token
const whiteList = ["/login", "/register", "/reset-password"]

export function createAuthGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const tokenStore = useTokenStore()
    const hasToken = tokenStore.token
    const userStore = useUserStore()

    // 如果有token
    if (hasToken) {
      // 如果用户信息不存在，则获取用户信息
      !userStore.userId && (await userStore.getUserInfo())
      if (to.path === "/login") {
        // 已登录状态下访问登录页面，重定向到首页
        next({ path: "/" })
      } else {
        next()
      }
    } else {
      // 如果没有token
      if (whiteList.includes(to.path)) {
        // 在白名单中，直接进入
        next()
      } else {
        // 不在白名单中，重定向到登录页面
        next(`/login?redirect=${to.path}`)
      }
    }
  })
}
