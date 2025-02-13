import { createRouter, createWebHistory } from "vue-router"
import type { App } from "vue"
import { setupRouterGuard } from "./guard"

import routes from "./routes/index"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export async function setupRouter(app: App) {
  setupRouterGuard(router)
  app.use(router)
}

export default router
