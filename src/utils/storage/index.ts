import { createStorage } from "./storage"

const prefixKey = ""

export const createLocalStorage = function (option: {
  prefixKey: string
  storage: globalThis.Storage
}) {
  return createStorage({
    prefixKey: option.prefixKey || "",
    storage: localStorage,
  })
}

export const createSessionStorage = function (option: {
  prefixKey: string
  storage: globalThis.Storage
}) {
  return createStorage({
    prefixKey: option.prefixKey || "",
    storage: sessionStorage,
  })
}

export const lStorage = createLocalStorage({ prefixKey: "", storage: localStorage })

export const sStorage = createSessionStorage({ prefixKey: "", storage: sessionStorage })
