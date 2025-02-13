import mitt from "mitt"

export const emitter = mitt()

// 定义事件类型
export const EventTypes = {
  REFRESH_KB_LIST: "refresh-kb-list",
} as const
