import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"

import "normalize.css"
import "./assets/css/index.less"

import ElementPlus from "element-plus"
import "element-plus/dist/index.css"
import zhCn from "element-plus/es/locale/lang/zh-cn"
import * as ElementPlusIconsVue from "@element-plus/icons-vue"

import { setupRouter } from "./router"

const app = createApp(App)

app.use(createPinia())

await setupRouter(app)

/** 导入 Element Plus */
app.use(ElementPlus, { locale: zhCn })
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount("#app")
